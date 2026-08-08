import bpy
import math
import os
import random
from mathutils import Vector

ROOT = os.getcwd()
RENDER_DIR = os.path.join(ROOT, "blender", "renders")
MODEL_DIR = os.path.join(ROOT, "public", "models")
os.makedirs(RENDER_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
random.seed(42)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def material(name, color, rough=.55, metal=0.0, emission=None, emission_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return m


def bevel(obj, amount=.08, segments=3):
    mod = obj.modifiers.new("storybook-soft-edges", "BEVEL")
    mod.width = amount
    mod.segments = segments
    return obj


def cube(name, loc, scale, mat, b=.08):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if b:
        bevel(o, b)
    o.data.materials.append(mat)
    return o


def cyl(name, loc, r, depth, mat, verts=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    return o


def cone(name, loc, r, depth, mat, verts=16):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=0, depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    return o


def sphere(name, loc, r, mat, seg=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=max(8, seg // 2), radius=r, location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    return o


def move_to_collection(obj, col):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)


def sign_text(text, loc, scale=.36):
    bpy.ops.object.text_add(location=loc, rotation=(math.radians(90), 0, 0))
    o = bpy.context.object
    o.data.body = text
    o.data.align_x = "CENTER"
    o.data.align_y = "CENTER"
    o.data.size = scale
    o.data.extrude = .025
    o.data.bevel_depth = .008
    o.data.materials.append(M["ivory"])
    return o


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


M = {
    "grass": material("Lush Grass", (.22, .62, .19), .72),
    "grass2": material("Hill Grass", (.31, .70, .27), .75),
    "path": material("Warm Stone Path", (.82, .66, .40), .76),
    "path2": material("Stone Edge", (.66, .52, .32), .82),
    "water": material("Crystal Water", (.03, .48, .86), .16, .02, (.04, .28, .58), .15),
    "cream": material("Warm Cream Walls", (.91, .79, .60), .62),
    "ivory": material("Ivory", (.99, .94, .78), .52),
    "blue": material("Royal Blue", (.05, .25, .72), .38),
    "blue2": material("Roof Blue", (.025, .12, .46), .42),
    "purple": material("Royal Purple", (.48, .16, .73), .40),
    "purple2": material("Roof Purple", (.30, .07, .52), .45),
    "teal": material("Think Teal", (.04, .48, .52), .40),
    "pink": material("Workshop Plum", (.65, .18, .50), .45),
    "gold": material("Academy Gold", (.96, .60, .08), .28, .22, (.9, .38, .02), .08),
    "wood": material("Warm Wood", (.34, .14, .045), .72),
    "dark": material("Lantern Metal", (.035, .05, .08), .38, .3),
    "glass": material("Window Glow", (.16, .54, .89), .18, 0, (1, .52, .10), 2.1),
    "leaf": material("Pine Green", (.05, .38, .12), .78),
    "leaf2": material("Fresh Green", (.11, .55, .18), .76),
    "rock": material("Mountain Rock", (.48, .53, .57), .9),
    "snow": material("Snow", (.91, .96, 1), .72),
    "flower1": material("Pink Flower", (.95, .18, .55), .62),
    "flower2": material("Gold Flower", (1, .65, .05), .62),
    "flower3": material("White Flower", (.98, .98, .92), .62),
}

# terrain and distant mountain bowl
cube("World Ground", (0, 0, -.35), (19, 24, .35), M["grass"], 0)
for i in range(16):
    a = (i / 16) * math.tau
    rr = 24 + random.uniform(-2, 3)
    x, y = math.cos(a) * rr, math.sin(a) * rr - 5
    r, h = random.uniform(3.8, 6.2), random.uniform(6, 11)
    cone("Distant Hill", (x, y, h / 2 - 1), r, h, M["rock"], 8)
    cone("Distant Green Cap", (x, y, h * .64), r * .86, h * .55, M["grass2"], 8)
    if i % 4 == 0:
        cone("Snow Peak", (x, y, h * .92), r * .36, h * .25, M["snow"], 8)


def path_strip(points, width=2.0):
    for i in range(len(points) - 1):
        x1, y1 = points[i]
        x2, y2 = points[i + 1]
        steps = max(3, int(math.dist((x1, y1), (x2, y2)) * 2))
        for s in range(steps + 1):
            t = s / steps
            x, y = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t
            o = cube("Path Stone", (x, y, .035), (width / 2 * (.92 + random.random() * .12), .45 + random.random() * .15, .045), M["path"], .16)
            o.rotation_euler[2] = math.atan2(y2 - y1, x2 - x1) + random.uniform(-.08, .08)


path_strip([(0, 18), (0, 13), (.5, 8), (0, 3), (0, -2), (0, -8)], 2.0)
path_strip([(0, 7), (-3, 6), (-6, 4), (-9, 3)], 1.45)
path_strip([(0, 5), (3, 5), (6, 3), (9, 2)], 1.35)
path_strip([(0, 0), (-3, -3), (-6, -6)], 1.35)
path_strip([(0, -1), (4, -3), (8, -6)], 1.35)

# river and bridge
cube("River", (-11, 8, .02), (4.8, 4.0, .08), M["water"], .6)
for i in range(8):
    cube("Bridge Plank", (-10.8 + i * .72, 8, .31), (.31, 1.25, .12), M["wood"], .05)
for yy in (6.95, 9.05):
    cube("Bridge Rail", (-8.2, yy, .9), (2.7, .07, .07), M["wood"], .03)
    for x in [-10.8, -9.8, -8.8, -7.8, -6.8, -5.8]:
        cyl("Bridge Post", (x, yy, .62), .06, 1.05, M["wood"], 10)


def tree(x, y, s=1):
    cyl("Tree Trunk", (x, y, .7 * s), .20 * s, 1.4 * s, M["wood"], 12)
    cone("Tree Crown", (x, y, 2.0 * s), 1.05 * s, 2.5 * s, M["leaf"], 12)
    cone("Tree Crown", (x, y, 2.8 * s), .78 * s, 2.0 * s, M["leaf2"], 12)


def lamp(x, y):
    cyl("Lamp Post", (x, y, .8), .055, 1.6, M["dark"], 10)
    sphere("Lamp Glow", (x, y, 1.72), .16, M["glass"], 14)


def flower(x, y, mat):
    cyl("Flower Stem", (x, y, .13), .018, .26, M["leaf2"], 6)
    sphere("Flower", (x, y, .31), .09, mat, 10)


for x, y, s in [(-15, -6, 1.3), (-14, 1, 1.1), (-14, 14, 1.3), (14, -6, 1.2), (14, 1, 1.25), (15, 13, 1.4), (-5, 10, .8), (5, 10, .8), (-5, -8, .9), (5, -8, .9), (-11, 2, .8), (11, 4, .9), (-4, 3, .65), (4, 2, .7)]:
    tree(x, y, s)
for x, y in [(-2, 10), (2, 10), (-2, 5), (2, 5), (-3, 0), (3, 0), (-5, -3), (5, -3), (-5, 7), (5, 7)]:
    lamp(x, y)
for i in range(120):
    a, r = random.random() * math.tau, random.uniform(3, 17)
    x, y = math.cos(a) * r, math.sin(a) * r + 3
    if abs(x) < 2.0:
        continue
    flower(x, y, [M["flower1"], M["flower2"], M["flower3"]][i % 3])


def make_building(name, x, y, w, d, h, roofmat, label, kind="house", symbol=None):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    body = cube(name + " Body", (x, y, h / 2), (w / 2, d / 2, h / 2), M["cream"], .16)
    move_to_collection(body, col)
    trim = cube(name + " Foundation", (x, y, .30), (w * .53, d * .53, .30), M["path2"], .10)
    move_to_collection(trim, col)
    if kind == "tower":
        tower = cyl(name + " Tower", (x + w * .22, y, h + 1.1), w * .22, 2.4, M["cream"], 20)
        move_to_collection(tower, col)
        sp = cone(name + " Tower Spire", (x + w * .22, y, h + 3.0), w * .34, 1.9, roofmat, 20)
        move_to_collection(sp, col)
    elif kind == "castle":
        for dx in (-w * .38, w * .38):
            t = cyl(name + " Turret", (x + dx, y, h + .55), w * .17, 2.8, M["cream"], 20)
            move_to_collection(t, col)
            sp = cone(name + " Turret Roof", (x + dx, y, h + 2.35), w * .25, 1.45, roofmat, 20)
            move_to_collection(sp, col)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=max(w, d) * .72, depth=1.55, location=(x, y, h + .70), rotation=(0, 0, math.radians(45)))
        roof = bpy.context.object
        roof.name = name + " Roof"
        roof.data.materials.append(roofmat)
        move_to_collection(roof, col)
    door = cube(name + " Door", (x, y - d / 2 - .05, .82), (.50, .11, .82), M["wood"], .12)
    move_to_collection(door, col)
    glow = cube(name + " Door Glow", (x, y - d / 2 - .14, 1.1), (.38, .04, .62), M["glass"], .10)
    move_to_collection(glow, col)
    for dx in (-w * .28, w * .28):
        win = cube(name + " Window", (x + dx, y - d / 2 - .08, h * .56), (.25, .08, .39), M["glass"], .08)
        move_to_collection(win, col)
    plaque = cube(name + " Sign", (x, y - d / 2 - .16, h + .15), (max(1.0, len(label) * .10), .08, .30), M["wood"], .08)
    move_to_collection(plaque, col)
    txt = sign_text(label, (x, y - d / 2 - .25, h + .18), min(.42, max(.28, w * .10)))
    move_to_collection(txt, col)
    if symbol:
        sym = sign_text(symbol, (x, y - d / 2 - .26, h + 1.0), .65)
        move_to_collection(sym, col)
    return col


make_building("Math Manor", -8.4, 4.0, 4.3, 3.5, 3.25, M["blue2"], "Math Manor", "house", "+")
make_building("Science Lab", -7.8, -4.7, 4.4, 3.7, 3.6, M["purple2"], "Science Lab", "tower", "LAB")
make_building("Story Keep", 0, 1.8, 5.8, 4.8, 4.45, M["blue2"], "Story Keep", "castle", "A")
make_building("Word Workshop", 7.2, 1.0, 4.2, 3.5, 3.55, M["purple2"], "Word Workshop", "house", "A")
make_building("Think Tower", 8.5, -5.0, 4.0, 3.4, 4.6, M["teal"], "Think Tower", "tower", "!")
make_building("Code Core", 4.6, -10.0, 3.8, 3.2, 3.1, M["blue2"], "Code Core", "house", "<>")
make_building("Explorer Lodge", -2.3, -10.2, 3.9, 3.2, 3.1, M["blue2"], "Explorer Lodge", "house", "G")
make_building("Life HQ", 10.5, -10.0, 3.8, 3.2, 3.1, M["teal"], "Life HQ", "house", "*")

# grand academy castle, cliff and waterfall
cube("Castle Cliff", (0, -18, 1.4), (6.7, 4.4, 1.4), M["rock"], .5)
for tx, ty, h, r in [(-2.2, -18, 6.8, 1.05), (2.2, -18, 6.8, 1.05), (0, -18, 9.0, 1.4), (-4.2, -18.3, 5.6, .9), (4.2, -18.3, 5.6, .9)]:
    cyl("Academy Castle Tower", (tx, ty, 2.8 + h / 2), r, h, M["cream"], 24)
    cone("Academy Castle Spire", (tx, ty, 2.8 + h + 1.4), r * 1.35, 2.8, M["blue2"], 24)
cube("Academy Castle Keep", (0, -18, 5.8), (4.2, 2.2, 3.1), M["cream"], .20)
cube("Castle Door", (0, -15.76, 4.25), (.65, .10, 1.4), M["glass"], .10)
cube("Waterfall", (5.7, -15.5, 2.0), (.7, .10, 3.0), M["water"], .08)
cube("Waterfall Pool", (5.7, -14.8, .12), (2.2, 1.5, .12), M["water"], .35)

# entrance sign
cube("Academy Sign Board", (9.8, 13.2, 1.15), (2.2, .25, 1.0), M["wood"], .18)
for x in (7.9, 11.7):
    cyl("Academy Sign Post", (x, 13.2, .65), .11, 1.3, M["wood"], 10)
sign_text("Genius\nAcademy", (9.8, 12.92, 1.25), .52)

# lighting and portrait preview
world = bpy.context.scene.world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value = (.13, .48, .95, 1)
bg.inputs["Strength"].default_value = .55
bpy.ops.object.light_add(type="SUN", location=(-12, 9, 24))
sun = bpy.context.object
sun.data.energy = 3.2
sun.data.angle = math.radians(10)
sun.rotation_euler = (math.radians(28), math.radians(-12), math.radians(-28))
bpy.ops.object.light_add(type="AREA", location=(0, 8, 22))
area = bpy.context.object
area.data.energy = 1100
area.data.shape = "DISK"
area.data.size = 16
bpy.ops.object.camera_add(location=(0, 26, 18))
cam = bpy.context.object
bpy.context.scene.camera = cam
cam.data.lens = 52
look_at(cam, (0, 0, 3.2))
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x = 900
scene.render.resolution_y = 1600
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = os.path.join(RENDER_DIR, "academy-preview.png")
scene.view_settings.look = "AgX - Medium High Contrast"

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "blender", "genius-academy.blend"))
bpy.ops.render.render(write_still=True)

# Export only renderable world objects; the browser owns player/camera/interaction.
for o in bpy.context.scene.objects:
    o.select_set(False)
for o in bpy.context.scene.objects:
    if o.type in {"MESH", "CURVE", "FONT"}:
        o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=os.path.join(MODEL_DIR, "genius-academy.glb"),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_materials="EXPORT",
)
print("Genius Academy premium storybook world rendered and exported.")
