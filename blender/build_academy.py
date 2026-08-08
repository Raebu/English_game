import bpy
import math
import os
from mathutils import Vector

ROOT = os.getcwd()
RENDER_DIR = os.path.join(ROOT, "blender", "renders")
MODEL_DIR = os.path.join(ROOT, "public", "models")
os.makedirs(RENDER_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

# Reset scene
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# Helpers

def mat(name, color, roughness=0.7, metallic=0.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1.0)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return m


def cube(name, loc, scale, material, bevel=0.08):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = o.modifiers.new("Soft edges", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    o.data.materials.append(material)
    return o


def cylinder(name, loc, radius, depth, material, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    return o


def cone(name, loc, radius1, depth, material, vertices=8):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=0, depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    return o


def sphere(name, loc, radius, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=radius, location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    return o


def sign_text(text, loc, size=0.42):
    bpy.ops.object.text_add(location=loc, rotation=(math.radians(90), 0, 0))
    o = bpy.context.object
    o.data.body = text
    o.data.align_x = "CENTER"
    o.data.size = size
    o.data.extrude = 0.025
    o.data.bevel_depth = 0.01
    o.data.materials.append(MATS["cream"])
    return o


def make_house(name, x, y, width, depth, height, wall_key, roof_key, label, tower=False):
    wall = MATS[wall_key]
    roofm = MATS[roof_key]
    g = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(g)

    body = cube(name + " Body", (x, y, height/2), (width/2, depth/2, height/2), wall, 0.14)
    for c in list(body.users_collection):
        c.objects.unlink(body)
    g.objects.link(body)

    # Roof
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=max(width, depth)*0.72, depth=1.5, location=(x, y, height+0.65), rotation=(0, 0, math.radians(45)))
    roof = bpy.context.object
    roof.name = name + " Roof"
    roof.data.materials.append(roofm)
    for c in list(roof.users_collection):
        c.objects.unlink(roof)
    g.objects.link(roof)

    # Door and windows
    door = cube(name + " Door", (x, y-depth/2-0.03, 0.72), (0.42, 0.08, 0.72), MATS["gold"], 0.05)
    for c in list(door.users_collection): c.objects.unlink(door)
    g.objects.link(door)

    for dx in (-width*0.28, width*0.28):
        win = cube(name + " Window", (x+dx, y-depth/2-0.05, height*0.58), (0.25, 0.07, 0.32), MATS["window"], 0.04)
        for c in list(win.users_collection): c.objects.unlink(win)
        g.objects.link(win)

    if tower:
        t = cylinder(name + " Tower", (x+width*0.34, y+depth*0.12, height+1.2), width*0.18, 2.4, wall, 16)
        for c in list(t.users_collection): c.objects.unlink(t)
        g.objects.link(t)
        tr = cone(name + " Tower Roof", (x+width*0.34, y+depth*0.12, height+2.75), width*0.35, 1.3, roofm, 16)
        for c in list(tr.users_collection): c.objects.unlink(tr)
        g.objects.link(tr)

    sign = sign_text(label, (x, y-depth/2-0.16, height+0.05), min(0.45, width*0.12))
    for c in list(sign.users_collection): c.objects.unlink(sign)
    g.objects.link(sign)
    return g


def make_tree(x, y, s=1.0):
    trunk = cylinder("Tree Trunk", (x, y, 0.7*s), 0.22*s, 1.4*s, MATS["trunk"], 12)
    cone("Tree Crown", (x, y, 2.1*s), 1.0*s, 2.4*s, MATS["tree"], 10)


def make_lamp(x, y):
    cylinder("Lamp Post", (x, y, 0.8), 0.06, 1.6, MATS["dark"], 12)
    sphere("Lamp Glow", (x, y, 1.72), 0.16, MATS["gold"])

# Materials
MATS = {
    "grass": mat("Grass", (0.28, 0.69, 0.23)),
    "path": mat("Path", (0.82, 0.69, 0.43)),
    "water": mat("Water", (0.05, 0.48, 0.86), roughness=0.18, metallic=0.05),
    "blue": mat("Blue Walls", (0.16, 0.42, 0.86)),
    "pink": mat("Pink Walls", (0.86, 0.24, 0.55)),
    "purple": mat("Purple Walls", (0.42, 0.26, 0.79)),
    "orange": mat("Orange Walls", (0.83, 0.39, 0.13)),
    "teal": mat("Teal Walls", (0.08, 0.56, 0.55)),
    "creamwall": mat("Cream Walls", (0.91, 0.79, 0.58)),
    "roofblue": mat("Blue Roof", (0.06, 0.18, 0.52)),
    "roofpurple": mat("Purple Roof", (0.35, 0.15, 0.65)),
    "roofteal": mat("Teal Roof", (0.04, 0.39, 0.45)),
    "gold": mat("Gold", (0.95, 0.67, 0.10), roughness=0.35, metallic=0.15),
    "cream": mat("Cream Text", (1.0, 0.91, 0.71)),
    "window": mat("Window", (0.24, 0.72, 0.95), roughness=0.2),
    "trunk": mat("Trunk", (0.31, 0.16, 0.07)),
    "tree": mat("Tree", (0.10, 0.47, 0.17)),
    "dark": mat("Dark Metal", (0.04, 0.07, 0.12), roughness=0.4, metallic=0.25),
    "skin": mat("Skin", (0.72, 0.43, 0.29)),
    "hair": mat("Hair", (0.14, 0.06, 0.03)),
    "hoodie": mat("Hoodie", (0.03, 0.25, 0.74)),
    "jeans": mat("Jeans", (0.03, 0.08, 0.18)),
    "backpack": mat("Backpack", (0.37, 0.16, 0.05)),
}

# World base
cube("Ground", (0, 0, -0.18), (18, 22, 0.18), MATS["grass"], 0)

# Main winding-ish path pieces
cube("Main Path", (0, 4.0, 0.03), (2.2, 14.5, 0.04), MATS["path"], 0.12)
cube("Cross Path", (0, -2.5, 0.04), (13.5, 1.35, 0.05), MATS["path"], 0.12)
cube("Upper Path", (0, 9.5, 0.04), (11.5, 1.1, 0.05), MATS["path"], 0.12)

# Pond and bridge
cube("Pond", (-10.5, 8.5, 0.01), (4.0, 3.0, 0.08), MATS["water"], 0.5)
cube("Bridge Deck", (-7.0, 8.5, 0.35), (2.2, 0.9, 0.15), MATS["creamwall"], 0.08)
for bx in (-8.7, -7.8, -6.9, -6.0, -5.3):
    cylinder("Bridge Rail", (bx, 7.75, 0.75), 0.05, 0.8, MATS["trunk"], 10)
    cylinder("Bridge Rail", (bx, 9.25, 0.75), 0.05, 0.8, MATS["trunk"], 10)

# Academy buildings arranged like the approved concept
make_house("Math Manor", -8.4, 3.8, 4.1, 3.5, 3.1, "creamwall", "roofblue", "Math Manor", tower=False)
make_house("Science Lab", -7.8, -5.2, 4.1, 3.5, 3.3, "purple", "roofpurple", "Science Lab", tower=True)
make_house("Story Keep", 0.0, 1.8, 5.6, 4.6, 4.2, "creamwall", "roofblue", "Story Keep", tower=True)
make_house("Word Workshop", 7.0, 1.0, 4.0, 3.3, 3.4, "pink", "roofpurple", "Word Workshop", tower=False)
make_house("Think Tower", 8.0, -5.5, 3.8, 3.4, 4.5, "teal", "roofteal", "Think Tower", tower=True)

# Additional subject houses in the back village
make_house("Code Core", 4.5, -9.8, 3.7, 3.2, 3.0, "blue", "roofblue", "Code Core", tower=False)
make_house("Explorer Lodge", -1.8, -10.0, 3.8, 3.1, 3.0, "orange", "roofblue", "Explorer Lodge", tower=False)
make_house("Life HQ", 10.0, -10.0, 3.8, 3.1, 3.0, "teal", "roofteal", "Life HQ", tower=False)

# Distant academy castle
for tx, ty, h in [(-1.8,-17,6.5),(1.8,-17,6.5),(0,-17,8.3),(-3.6,-17.4,5.3),(3.6,-17.4,5.3)]:
    cylinder("Castle Tower", (tx, ty, h/2), 1.0 if tx else 1.3, h, MATS["creamwall"], 20)
    cone("Castle Spire", (tx, ty, h+1.2), 1.35 if tx else 1.65, 2.5, MATS["roofblue"], 20)
cube("Castle Keep", (0,-17,3.3),(3.5,1.8,3.3),MATS["creamwall"],0.18)

# Landscaping
for x,y,s in [(-13,-7,1.2),(-13,0,1.0),(-13,14,1.2),(13,-7,1.2),(13,0,1.1),(13,13,1.25),(-4,7,0.75),(4,8,0.85),(-4,-7,0.8),(4,-7,0.8),(-11,3,0.75),(11,4,0.75)]:
    make_tree(x,y,s)

for x,y in [(-2,5),(2,5),(-2,-1),(2,-1),(-5,9),(5,9),(-5,-3),(5,-3)]:
    make_lamp(x,y)

# Flowers as small coloured spheres
flower_mats=[mat("Flower Pink",(0.95,0.25,0.55)), mat("Flower Yellow",(1.0,0.72,0.10)), mat("Flower White",(0.95,0.95,0.95))]
for i,(x,y) in enumerate([(-5,4.5),(-4.7,4.8),(-4.4,4.4),(5.2,3.8),(5.6,4.1),(7,5),(7.4,5.2),(-8,8),(-7.5,8.4),(2,7.5),(2.4,7.8)]):
    sphere("Flower", (x,y,0.18), 0.14, flower_mats[i%len(flower_mats)])

# Player avatar
cube("Avatar Torso", (0,12.8,1.35),(0.48,0.32,0.7),MATS["hoodie"],0.12)
sphere("Avatar Head", (0,12.8,2.45),0.5,MATS["skin"])
sphere("Avatar Hair", (0,12.9,2.72),0.52,MATS["hair"])
cube("Avatar Backpack", (0,13.18,1.45),(0.44,0.18,0.52),MATS["backpack"],0.12)
for x in (-0.24,0.24):
    cube("Avatar Leg",(x,12.8,0.55),(0.16,0.18,0.52),MATS["jeans"],0.05)

# Lighting
bpy.context.scene.world.color=(0.16,0.48,0.86)
bpy.ops.object.light_add(type='SUN', location=(-10,5,18))
sun=bpy.context.object
sun.data.energy=3.0
sun.rotation_euler=(math.radians(28),math.radians(-15),math.radians(-25))

bpy.ops.object.light_add(type='AREA', location=(0,4,16))
area=bpy.context.object
area.data.energy=900
area.data.shape='DISK'
area.data.size=12

# Camera
bpy.ops.object.camera_add(location=(0,23,17), rotation=(math.radians(58),0,math.radians(180)))
cam=bpy.context.object
bpy.context.scene.camera=cam

def look_at(obj, target):
    direction=Vector(target)-obj.location
    obj.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
look_at(cam,(0,1.5,2.2))
cam.data.lens=46

# Render settings
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'
scene.eevee.use_gtao=True
scene.eevee.gtao_distance=3
scene.eevee.gtao_factor=1.35
scene.render.resolution_x=900
scene.render.resolution_y=1600
scene.render.resolution_percentage=65
scene.render.image_settings.file_format='PNG'
scene.render.filepath=os.path.join(RENDER_DIR,'academy-preview.png')
scene.view_settings.view_transform='Standard'
scene.view_settings.look='Medium High Contrast'
scene.render.film_transparent=False

# Save source blend
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender','genius-academy.blend'))

# Render preview
bpy.ops.render.render(write_still=True)

# Export GLB
bpy.ops.export_scene.gltf(
    filepath=os.path.join(MODEL_DIR,'genius-academy.glb'),
    export_format='GLB',
    export_apply=True,
    export_yup=True,
    export_materials='EXPORT',
)

print('Built Genius Academy Blender scene')
print(os.path.join(RENDER_DIR,'academy-preview.png'))
print(os.path.join(MODEL_DIR,'genius-academy.glb'))
