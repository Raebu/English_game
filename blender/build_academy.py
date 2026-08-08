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
random.seed(84)

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
    if amount <= 0:
        return obj
    mod = obj.modifiers.new("soft-storybook-edges", "BEVEL")
    mod.width = amount
    mod.segments = segments
    return obj


def cube(name, loc, scale, mat, b=.08, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel(o, b)
    o.data.materials.append(mat)
    return o


def cyl(name, loc, r, depth, mat, verts=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    bevel(o, min(.05, r * .08), 2)
    return o


def cone(name, loc, r, depth, mat, verts=20, r2=0):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    return o


def sphere(name, loc, r, mat, seg=16, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    return o


def torus(name, loc, major, minor, mat, rot=(math.pi/2,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=24, minor_segments=8, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    return o


def sign_text(text, loc, scale=.34, rot=(math.radians(90), 0, 0), mat=None):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.data.body = text
    o.data.align_x = "CENTER"
    o.data.align_y = "CENTER"
    o.data.size = scale
    o.data.extrude = .025
    o.data.bevel_depth = .008
    o.data.materials.append(mat or M["ivory"])
    return o


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


M = {
    "grass": material("Velvet Grass", (.20, .58, .17), .78),
    "grass2": material("Sunny Grass", (.34, .70, .25), .78),
    "path": material("Honey Cobble", (.78, .60, .34), .82),
    "pathlight": material("Sunlit Cobble", (.91, .76, .50), .78),
    "stone": material("Warm Limestone", (.82, .73, .58), .78),
    "stone2": material("Cream Limestone", (.94, .87, .70), .72),
    "stone3": material("Stone Trim", (.64, .52, .36), .82),
    "blue": material("Academy Blue", (.035, .21, .66), .36),
    "blue2": material("Deep Roof Blue", (.018, .09, .40), .40),
    "cyan": material("Tower Cyan", (.04, .48, .62), .38),
    "purple": material("Royal Purple", (.42, .09, .66), .38),
    "plum": material("Workshop Plum", (.62, .14, .47), .42),
    "gold": material("Gilded Gold", (.96, .55, .055), .24, .28, (.9,.35,.02), .08),
    "wood": material("Oak", (.30, .11, .028), .78),
    "wood2": material("Warm Oak", (.49, .23, .07), .72),
    "dark": material("Lamp Iron", (.025, .035, .055), .35, .35),
    "glass": material("Golden Window", (.18, .48, .88), .12, 0, (1.0, .44, .06), 3.0),
    "water": material("Azure Water", (.015, .43, .84), .12, .02, (.02,.18,.52), .18),
    "leaf": material("Pine", (.035, .30, .075), .82),
    "leaf2": material("Garden Green", (.10, .50, .13), .80),
    "leaf3": material("Fresh Leaf", (.26, .64, .20), .78),
    "rock": material("Mountain Rock", (.43, .47, .50), .92),
    "snow": material("Snow", (.94, .97, 1.0), .68),
    "pink": material("Pink Flowers", (.94, .16, .50), .58),
    "yellow": material("Gold Flowers", (1.0, .64, .05), .58),
    "white": material("White Flowers", (.98, .98, .90), .58),
    "lavender": material("Lavender", (.62, .30, .86), .58),
    "ivory": material("Ivory Lettering", (.99, .93, .72), .50),
}

# --- World terrain and skyline -------------------------------------------------
cube("World Ground", (0, 1, -.45), (22, 29, .45), M["grass"], 0)

# rolling mounds around campus
for i in range(28):
    a = (i / 28) * math.tau
    rr = random.uniform(17, 25)
    x = math.cos(a) * rr
    y = math.sin(a) * rr - 2
    sphere("Rolling Hill", (x, y, random.uniform(-1.0, .2)), random.uniform(3.0, 5.8), M["grass2"], scale=(1.4,1.0,.48))

# distant mountains and snow peaks
for i in range(15):
    a = (i / 15) * math.tau
    rr = 32 + random.uniform(-3, 3)
    x, y = math.cos(a) * rr, math.sin(a) * rr - 9
    r, h = random.uniform(4.5, 7.2), random.uniform(8, 14)
    cone("Mountain", (x, y, h/2-1.3), r, h, M["rock"], 9)
    cone("Mountain Grass", (x, y, h*.48), r*.86, h*.48, M["grass2"], 9)
    if i % 3 == 0:
        cone("Snow Crown", (x, y, h*.91), r*.35, h*.26, M["snow"], 9)


def cobble_path(points, width=1.8, density=2.4):
    for i in range(len(points)-1):
        x1,y1 = points[i]; x2,y2 = points[i+1]
        length = math.dist((x1,y1),(x2,y2))
        steps = max(4, int(length*density))
        ang = math.atan2(y2-y1,x2-x1)
        for s in range(steps+1):
            t=s/steps
            cx=x1+(x2-x1)*t; cy=y1+(y2-y1)*t
            for lane in (-.55,0,.55):
                px=cx-math.sin(ang)*lane*width*.72 + random.uniform(-.10,.10)
                py=cy+math.cos(ang)*lane*width*.72 + random.uniform(-.10,.10)
                mat=M["pathlight"] if (s+int(lane*10))%4==0 else M["path"]
                cube("Cobble", (px,py,.035), (.30+random.random()*.12,.23+random.random()*.08,.045), mat, .10, (0,0,ang+random.uniform(-.18,.18)))

cobble_path([(0,19),(0,14),(.5,10),(0,6),(.3,2),(0,-2),(0,-8)],2.0)
cobble_path([(0,8),(-3,7),(-6,5),(-9,4)],1.4)
cobble_path([(0,6),(3,5),(6,3),(9,2)],1.4)
cobble_path([(0,1),(-3,-2),(-6,-5)],1.35)
cobble_path([(0,0),(3,-3),(7,-6)],1.35)

# river with irregular banks
cube("River", (-11,8,.00), (5.2,4.3,.11), M["water"], .85)
for i in range(30):
    x=random.uniform(-16,-6); y=random.choice([3.8,12.2])+random.uniform(-.6,.6)
    sphere("River Rock", (x,y,.18), random.uniform(.18,.48), M["rock"], scale=(1.4,1,.7))

# wooden bridge
for i in range(11):
    cube("Bridge Plank", (-11.2+i*.52,8,.34), (.22,1.35,.10), M["wood2"], .04)
for yy in (6.82,9.18):
    cube("Bridge Rail", (-8.6,yy,.92),(2.8,.065,.065),M["wood2"],.025)
    for x in [-11.2,-10.2,-9.2,-8.2,-7.2,-6.2]:
        cyl("Bridge Post",(x,yy,.64),.055,1.12,M["wood2"],10)


def tree(x,y,s=1):
    cyl("Tree Trunk",(x,y,.65*s),.18*s,1.3*s,M["wood"],10)
    cone("Pine Lower",(x,y,1.85*s),1.15*s,2.4*s,M["leaf"],14)
    cone("Pine Mid",(x,y,2.65*s),.92*s,2.0*s,M["leaf2"],14)
    cone("Pine Top",(x,y,3.35*s),.62*s,1.5*s,M["leaf3"],14)


def bush(x,y,s=.65):
    for dx,dy,rr in [(-.28,0,.52),(.25,.03,.48),(0,.25,.50),(0,-.22,.46)]:
        sphere("Garden Bush",(x+dx*s,y+dy*s,.42*s),rr*s,M["leaf2"],scale=(1,1,.8))


def flower_patch(x,y,s=.8):
    mats=[M["pink"],M["yellow"],M["white"],M["lavender"]]
    for i in range(7):
        a=i*math.tau/7+random.uniform(-.2,.2); r=random.uniform(.08,.42)*s
        cyl("Flower Stem",(x+math.cos(a)*r,y+math.sin(a)*r,.12*s),.012*s,.24*s,M["leaf3"],6)
        sphere("Flower Head",(x+math.cos(a)*r,y+math.sin(a)*r,.27*s),.07*s,mats[i%4])


def lamp(x,y):
    cyl("Lamp Post",(x,y,.82),.052,1.64,M["dark"],10)
    cube("Lamp Cap",(x,y,1.52),(.18,.18,.10),M["dark"],.03)
    sphere("Lamp Glow",(x,y,1.74),.17,M["glass"])
    cone("Lamp Crown",(x,y,1.98),.22,.30,M["dark"],8)

# perimeter trees + campus landscaping
for x,y,s in [(-16,-7,1.35),(-15,0,1.1),(-15,14,1.3),(15,-7,1.3),(15,0,1.15),(15,13,1.45),(-6,11,.8),(6,11,.85),(-6,-9,.95),(6,-9,.95),(-12,2,.85),(12,4,.9),(-4,3,.65),(4,2,.7),(-10,-8,.75),(10,-8,.8),(-13,8,.9),(13,9,.95)]: tree(x,y,s)
for x,y in [(-2,11),(2,11),(-2,6),(2,6),(-3,1),(3,1),(-5,-3),(5,-3),(-5,8),(5,8),(-8,6),(8,5)]: lamp(x,y)
for i in range(52):
    a=random.random()*math.tau; r=random.uniform(3.2,17.5)
    x=math.cos(a)*r; y=math.sin(a)*r+2
    if abs(x)<2.2 and -8<y<18: continue
    bush(x,y,random.uniform(.5,.85))
    if i%2==0: flower_patch(x+random.uniform(-.4,.4),y+random.uniform(-.4,.4),random.uniform(.6,1.0))

# --- premium building kit ------------------------------------------------------
def window(name,x,y,z,w=.34,h=.55,front_y=None):
    fy = y if front_y is None else front_y
    cube(name+" Window Frame",(x,fy,z),(w+.09,.09,h+.10),M["stone3"],.08)
    cube(name+" Window Glow",(x,fy-.10,z),(w,.045,h),M["glass"],.07)
    cube(name+" Mullion V",(x,fy-.15,z),(.035,.03,h),M["gold"],.02)
    cube(name+" Mullion H",(x,fy-.15,z),(w,.03,.035),M["gold"],.02)


def flower_box(name,x,y,z,w=.45):
    cube(name+" Box",(x,y,z),(w,.16,.14),M["wood2"],.05)
    for i in range(5):
        sphere(name+" Bloom",(x-w*.75+i*(w*1.5/4),y-.05,z+.22),.08,[M["pink"],M["white"],M["lavender"]][i%3])


def fence_segment(x,y,length=1.5,rot=0):
    cube("Fence Rail",(x,y,.42),(length/2,.055,.055),M["ivory"],.025,rot=(0,0,rot))
    dx=math.cos(rot); dy=math.sin(rot)
    for t in (-.45,0,.45):
        px=x+dx*t*length; py=y+dy*t*length
        cube("Fence Picket",(px,py,.42),(.045,.045,.42),M["ivory"],.02)


def roof_house(name,x,y,w,d,h,mat,col):
    # deep eaves + layered 4-sided roof
    cube(name+" Eaves",(x,y,h+.28),(w*.56,d*.56,.16),M["stone3"],.10)
    bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=max(w,d)*.76,depth=1.85,location=(x,y,h+1.05),rotation=(0,0,math.radians(45)))
    roof=bpy.context.object; roof.name=name+" Roof"; roof.data.materials.append(mat)
    # decorative ridge finial
    sphere(name+" Roof Finial",(x,y,h+2.05),.15,M["gold"])
    cone(name+" Roof Flagpole",(x,y,h+2.35),.035,.65,M["gold"],8,r2=.025)


def round_tower(name,x,y,r,h,roofmat,offset=0):
    cyl(name+" Tower",(x,y,h/2),r,h,M["stone2"],28)
    # horizontal stone courses
    for z in (.55,h*.35,h*.68,h-.25):
        cyl(name+" Stone Band",(x,y,z),r*1.04,.12,M["stone3"],28)
    cone(name+" Spire",(x,y,h+1.05),r*1.18,2.1,roofmat,28)
    sphere(name+" Finial",(x,y,h+2.14),.13,M["gold"])


def add_entry(name,x,front_y,h=1.15):
    # steps + framed glowing door + arch
    for i in range(3):
        cube(name+" Step",(x,front_y-.38-i*.18,.10+i*.08),(.82-i*.10,.38,.10),M["stone2"],.08)
    cube(name+" Door Frame",(x,front_y,.95),(.63,.16,.92),M["stone3"],.12)
    cube(name+" Door",(x,front_y-.16,.92),(.46,.08,.78),M["wood2"],.10)
    cube(name+" Door Glow",(x,front_y-.25,1.02),(.34,.04,.58),M["glass"],.08)
    torus(name+" Door Arch",(x,front_y-.19,1.52),.52,.10,M["gold"])


def plaque(name,label,x,front_y,z,w):
    cube(name+" Sign",(x,front_y,z),(w,.09,.31),M["wood2"],.10)
    sign_text(label,(x,front_y-.11,z+.01),min(.38,max(.25,w*.18)))


def premium_house(name,x,y,w,d,h,roofmat,label,accent="blue",kind="house",symbol=None):
    front=y-d/2-.06
    cube(name+" Main",(x,y,h/2),(w/2,d/2,h/2),M["stone2"],.18)
    cube(name+" Foundation",(x,y,.26),(w*.54,d*.54,.26),M["stone3"],.10)
    # corner quoin columns
    for dx in (-w*.47,w*.47):
        for z in (.8,1.65,2.5):
            cube(name+" Corner Stone",(x+dx,front+.04,z),(.18,.16,.28),M["stone"],.045)
    if kind=="house":
        roof_house(name,x,y,w,d,h,roofmat,None)
        # dormer
        cube(name+" Dormer",(x+w*.20,front-.15,h+.78),(.52,.46,.52),M["stone2"],.08)
        cone(name+" Dormer Roof",(x+w*.20,front-.15,h+1.43),.70,.72,roofmat,4)
        window(name+" Dormer",x+w*.20,front-.63,h+.78,.18,.27)
    elif kind=="tower":
        roof_house(name,x,y,w,d,h,roofmat,None)
        round_tower(name+" Side",x+w*.31,y,h+2.55,w*.22,roofmat)
    elif kind=="castle":
        roof_house(name,x,y,w,d,h,roofmat,None)
        for dx in (-w*.40,w*.40):
            round_tower(name+" Turret",x+dx,y,h+1.4,w*.17,roofmat)
        # clock / crest
        cyl(name+" Crest",(x,front-.22,h+.95),.46,.10,M["gold"],24)
        cyl(name+" Crest Face",(x,front-.29,h+.95),.36,.07,M["ivory"],24)
    add_entry(name,x,front)
    # two floors of framed windows
    for z in (h*.43,h*.70):
        for dx in (-w*.30,w*.30):
            window(name,x+dx,y,z,.26,.40,front_y=front-.02)
            if z < h*.5: flower_box(name,x+dx,front-.20,z-.58,.35)
    plaque(name,label,x,front-.25,h+.22,max(1.0,min(1.75,len(label)*.105)))
    if symbol:
        # subject crest above entrance
        cyl(name+" Subject Crest",(x,front-.30,h-.48),.38,.08,M["gold"],24)
        sign_text(symbol,(x,front-.40,h-.48),.42,mat=M["ivory"])
    # porch lamps
    for dx in (-.82,.82):
        cyl(name+" Porch Lamp",(x+dx,front-.22,1.28),.045,.45,M["dark"],8)
        sphere(name+" Porch Glow",(x+dx,front-.22,1.56),.12,M["glass"])
    # small front garden and fence pieces
    for dx in (-w*.58,w*.58):
        bush(x+dx,front-.75,.65); flower_patch(x+dx,front-.95,.75)
    fence_segment(x-w*.62,front-.92,1.55,0)
    fence_segment(x+w*.62,front-.92,1.55,0)

# coherent but distinct subject architecture
premium_house("Math Manor",-8.4,4.0,4.5,3.7,3.45,M["blue2"],"Math Manor","blue","house","+")
premium_house("Science Lab",-7.8,-4.7,4.6,3.8,3.75,M["purple"],"Science Lab","purple","tower","⚗")
premium_house("Story Keep",0,1.8,6.0,4.9,4.65,M["blue2"],"Story Keep","blue","castle","A")
premium_house("Word Workshop",7.2,1.0,4.4,3.6,3.75,M["purple"],"Word Workshop","purple","house","A")
premium_house("Think Tower",8.5,-5.0,4.2,3.5,4.65,M["cyan"],"Think Tower","cyan","tower","!")
premium_house("Code Core",4.6,-10.0,4.0,3.4,3.35,M["blue"],"Code Core","blue","house","<>")
premium_house("Explorer Lodge",-2.3,-10.2,4.1,3.5,3.35,M["blue2"],"Explorer Lodge","blue","house","G")
premium_house("Life HQ",10.5,-10.0,4.0,3.4,3.35,M["cyan"],"Life HQ","cyan","house","*")

# extra decorative academy structures / sightline depth
round_tower("Music Spire",12.7,5.7,1.25,5.0,M["purple"])
round_tower("Art Turret",-12.5,-1.0,1.18,4.4,M["plum"])

# grand distant castle on a landscaped cliff
sphere("Castle Hill",(0,-19,1.0),7.7,M["grass2"],scale=(1.35,1,.55))
cube("Castle Cliff",(0,-19,1.65),(7.0,4.7,1.55),M["rock"],.60)
cube("Castle Keep",(0,-19,6.0),(4.4,2.4,3.2),M["stone2"],.22)
for tx,h,r in [(-4.3,5.8,.95),(-2.2,7.2,1.1),(0,9.3,1.45),(2.2,7.2,1.1),(4.3,5.8,.95)]:
    round_tower("Academy Castle",tx,-19,2.9+h,r,M["blue2"])
# castle windows, balconies and glowing gate
for z in (5.0,6.4,7.7):
    for dx in (-2.8,-1.4,0,1.4,2.8): window("Castle",dx,-16.56,z,.22,.34,front_y=-16.56)
cube("Castle Balcony",(0,-16.4,6.6),(2.4,.38,.13),M["stone3"],.08)
add_entry("Castle",0,-16.52)
# waterfall
cube("Waterfall",(5.9,-16.2,2.2),(.72,.10,3.4),M["water"],.10)
cube("Waterfall Pool",(5.9,-15.3,.10),(2.4,1.8,.12),M["water"],.40)

# foreground academy sign
cube("Academy Sign Board",(10.2,13.0,1.32),(2.35,.28,1.15),M["wood2"],.20)
for x in (8.2,12.2): cyl("Academy Sign Post",(x,13.0,.72),.12,1.45,M["wood2"],10)
sign_text("Genius\nAcademy",(10.2,12.68,1.36),.50)
cyl("Academy Crest",(10.2,12.66,2.38),.42,.09,M["blue"],24)
sign_text("G",(10.2,12.55,2.38),.48,mat=M["gold"])
for dx in (-2.4,2.4): flower_patch(10.2+dx,12.65,1.2)

# --- lighting / atmosphere -----------------------------------------------------
world=bpy.context.scene.world
world.use_nodes=True
bg=world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value=(.08,.42,.90,1)
bg.inputs["Strength"].default_value=.68

bpy.ops.object.light_add(type="SUN",location=(-12,10,26))
sun=bpy.context.object; sun.data.energy=3.0; sun.data.angle=math.radians(9)
sun.rotation_euler=(math.radians(28),math.radians(-15),math.radians(-30))

bpy.ops.object.light_add(type="AREA",location=(0,8,20))
key=bpy.context.object; key.data.energy=1350; key.data.shape="DISK"; key.data.size=18
look_at(key,(0,0,2.5))

bpy.ops.object.light_add(type="AREA",location=(-12,-2,10))
fill=bpy.context.object; fill.data.energy=700; fill.data.size=12
look_at(fill,(0,2,2))

# portrait preview composed like approved screen
bpy.ops.object.camera_add(location=(0,27,17.5))
cam=bpy.context.object; bpy.context.scene.camera=cam
cam.data.lens=55
look_at(cam,(0,1.0,3.1))

scene=bpy.context.scene
# GitHub currently ships Blender 4.0; workflow normalises this if needed.
scene.render.engine="BLENDER_EEVEE_NEXT"
scene.render.resolution_x=900
scene.render.resolution_y=1600
scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
scene.render.filepath=os.path.join(RENDER_DIR,"academy-preview.png")
scene.view_settings.look="AgX - Medium High Contrast"

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,"blender","genius-academy.blend"))
bpy.ops.render.render(write_still=True)

# Export visual world; browser owns player/camera/interaction.
for o in bpy.context.scene.objects: o.select_set(False)
for o in bpy.context.scene.objects:
    if o.type in {"MESH","CURVE","FONT"}: o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=os.path.join(MODEL_DIR,"genius-academy.glb"),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_materials="EXPORT",
)
print("Genius Academy premium storybook world rendered and exported.")
