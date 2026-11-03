"""turtlegames: small games for the turtle page (and for IDLE, if this file sits next to
your script). Everything prints what happened and shows it on the board too.

    from turtlegames import *
    t = maze(1)        # drive t to the flag; walls stop it
    t = treasure()     # move around, it says warmer / colder, then t.dig()
    t = cannon()       # t.left(...) to aim, then t.fire()
    race("red")        # bet on a turtle, then watch the race
    ball = golf(1)     # ball.forward(...) into the hole in the fewest strokes
    art()              # a random spirograph; art(seed) repeats one
"""
import math
import random
import turtle

__all__ = ["maze", "treasure", "cannon", "race", "golf", "art", "last_winner", "GameTurtle"]

W, H = 640, 480  # the screen: x from -320 to 320, y from -240 to 240


# ---------- drawing helpers ----------

def _fresh():
    """A clean screen for a new game: the old board, turtles and messages go."""
    turtle.restart()


def _painter():
    """A hidden turtle that draws the board."""
    p = turtle.Turtle()
    p.hideturtle()
    p.speed(0)
    p.penup()
    return p


def _box(p, x1, y1, x2, y2, fill, outline=None):
    p.goto(x1, y1)
    p.pendown()
    p.color(outline or fill, fill)
    p.width(2 if outline else 1)
    p.begin_fill()
    for x, y in ((x2, y1), (x2, y2), (x1, y2), (x1, y1)):
        p.goto(x, y)
    p.end_fill()
    p.penup()
    p.width(1)


def _disc(p, x, y, r, fill, outline=None):
    p.goto(x, y - r)
    p.pendown()
    p.color(outline or fill, fill)
    p.width(2 if outline else 1)
    p.begin_fill()
    p.circle(r)
    p.end_fill()
    p.penup()
    p.width(1)


def _ring(p, x, y, r, color, width=2):
    p.goto(x, y - r)
    p.pendown()
    p.color(color)
    p.width(width)
    p.circle(r)
    p.penup()
    p.width(1)


def _line(p, x1, y1, x2, y2, color, width=2):
    p.goto(x1, y1)
    p.pendown()
    p.color(color)
    p.width(width)
    p.goto(x2, y2)
    p.penup()
    p.width(1)


def _text(p, x, y, text, size=14, color="black", align="center", bold=False):
    p.goto(x, y)
    p.color(color)
    p.write(text, align=align, font=("Arial", size, "bold" if bold else "normal"))


def _flag(p, x, y, color="#e5484d"):
    _line(p, x, y - 16, x, y + 22, "#333", 3)
    p.goto(x, y + 22)
    p.pendown()
    p.color(color, color)
    p.begin_fill()
    p.goto(x + 26, y + 14)
    p.goto(x, y + 6)
    p.goto(x, y + 22)
    p.end_fill()
    p.penup()


def _frame(p, color):
    """A border round the whole board."""
    _line(p, -318, -238, 318, -238, color, 4)
    _line(p, 318, -238, 318, 238, color, 4)
    _line(p, 318, 238, -318, 238, color, 4)
    _line(p, -318, 238, -318, -238, color, 4)


class _Hud:
    """One line of big text at the top of the board, replaced on every update."""

    def __init__(self, y=200, color="#1b2440"):
        self.p = _painter()
        self.y = y
        self.color = color

    def say(self, text, color=None, size=16):
        self.p.clear()
        _text(self.p, 0, self.y, text, size, color or self.color, bold=True)


def _pt(p):
    return "(%d, %d)" % (round(p[0]), round(p[1]))


# ---------- a turtle that knows about walls and goals ----------

class GameTurtle(turtle.Turtle):
    """A turtle whose moves are checked: it stops at walls, counts moves, and calls
    on_move after each one."""

    # class-level defaults: the base class moves the turtle while it is being built
    _checking = False
    walls = ()
    goal = None
    on_move = None
    hud = None
    moves = bumps = 0
    won = False

    def __init__(self):
        super().__init__()
        self.walls = []        # rectangles (x1, y1, x2, y2) the turtle can't enter
        self.goal = None       # (x, y, radius)
        self.moves = 0
        self.bumps = 0
        self.won = False
        self.on_move = None
        self.hud = None
        self._checking = True

    def _inside(self, x, y):
        if abs(x) > 312 or abs(y) > 232:
            return True  # the edge of the board
        for x1, y1, x2, y2 in self.walls:
            if min(x1, x2) - 7 <= x <= max(x1, x2) + 7 and min(y1, y2) - 7 <= y <= max(y1, y2) + 7:
                return True
        return False

    def _clip(self, start, end):
        """The furthest point along start->end before a wall (or end itself)."""
        sx, sy = start
        ex, ey = end
        dist = math.hypot(ex - sx, ey - sy)
        if dist == 0:
            return end, False
        steps = max(1, int(dist / 2))
        last = start
        for k in range(1, steps + 1):
            f = k / steps
            p = (sx + (ex - sx) * f, sy + (ey - sy) * f)
            if self._inside(*p):
                return last, True
            last = p
        return end, False

    def _goto(self, end):
        if not self._checking:
            return super()._goto(end)
        start = (self._position[0], self._position[1])
        if abs(end[0] - start[0]) < 1e-9 and abs(end[1] - start[1]) < 1e-9:
            return super()._goto(end)  # a zero move (showturtle, pen changes) isn't a move
        if self.won:
            print("You already won. Start a new game.")
            return
        end, hit = self._clip(start, (end[0], end[1]))
        end = turtle.Vec2D(end[0], end[1])  # the base class does maths on the position
        super()._goto(end)
        self.moves += 1
        if hit:
            self.bumps += 1
            print("💥 Ouch, a wall! The turtle stopped at", _pt(end))
        if self.goal and not self.won:
            gx, gy, r = self.goal
            if math.hypot(end[0] - gx, end[1] - gy) <= r:
                self.won = True
                msg = "🏆 You made it in %d move%s%s!" % (self.moves, "" if self.moves == 1 else "s",
                                                       " with %d bump%s" % (self.bumps, "" if self.bumps == 1 else "s") if self.bumps else "")
                print(msg)
                if self.hud:
                    self.hud.say(msg, "#1d8448", 22)
        if self.hud and not self.won:
            if hit:
                self.hud.say("💥 Ouch! Move %d · %d bump%s" % (self.moves, self.bumps, "" if self.bumps == 1 else "s"), "#c42d3a")
            else:
                self.hud.say("Move %d%s" % (self.moves, " · %d bump%s" % (self.bumps, "" if self.bumps == 1 else "s") if self.bumps else ""), None, 16)
        if self.on_move:
            self.on_move(self)

    def teleport(self, x, y):
        """Jump somewhere without drawing or checking (used when a game sets up)."""
        self._checking = False
        self.penup()
        self.goto(x, y)
        self.pendown()
        self._checking = True


# ---------- 1. maze ----------
# Walls are rectangles on a board of 80-pixel cells (8 across, 6 down).

def _vwall(x, y1, y2):
    return (x - 5, y1, x + 5, y2)


def _hwall(y, x1, x2):
    return (x1, y - 5, x2, y + 5)


TOP = 206  # above this is the header strip with the message; the turtle can't go there

MAZES = {
    1: {"start": (-280, -200), "goal": (280, 176), "walls": [
        _vwall(-160, -240, 80), _vwall(0, -80, TOP), _vwall(160, -240, 80)]},
    2: {"start": (-280, 176), "goal": (280, -200), "walls": [
        _vwall(-240, -80, TOP), _hwall(-80, -240, -80), _vwall(-80, -240, 80),
        _hwall(80, -80, 80), _vwall(80, 80, TOP), _vwall(80, -240, -80),
        _hwall(-80, 80, 240), _vwall(240, -80, 160)]},
    3: {"start": (-280, -200), "goal": (40, 40), "walls": [
        _hwall(-160, -240, 240), _vwall(240, -160, 160), _hwall(160, -160, 240), _vwall(-160, -80, 160),
        _hwall(-80, -160, 160), _vwall(160, -80, 80), _hwall(80, -80, 160), _vwall(-80, 0, 80),
        _hwall(0, -80, 80), _vwall(80, 0, 0)]},
}


def maze(level=1):
    """A maze. Drive the turtle to the flag: t.forward(50), t.left(90) ... or the arrow keys."""
    m = MAZES.get(level, MAZES[1])
    _fresh()
    turtle.bgcolor("#f6efdd")
    p = _painter()
    # a faint grid, so distances are easy to judge (one square = 80 steps)
    for k in range(-240, 241, 80):
        _line(p, k, -240, k, TOP, "#e8dfc8", 1)
    for k in range(-160, 161, 80):
        _line(p, -320, k, 320, k, "#e8dfc8", 1)
    _box(p, -320, TOP, 320, 240, "#e9dfc6")  # the header strip
    _line(p, -320, TOP, 320, TOP, "#8a7154", 2)
    _frame(p, "#8a7154")
    for w in m["walls"]:
        _box(p, *w, fill="#8a7154")
    sx, sy = m["start"]
    _disc(p, sx, sy, 26, "#fff3c4", "#e0b84a")
    _text(p, sx, sy - 44, "start", 11, "#8a7154")
    gx, gy = m["goal"]
    _disc(p, gx, gy, 26, "#ffe1e1", "#e5484d")
    _flag(p, gx, gy)
    _text(p, 0, -232, "Maze %d · one grid square is 80 steps · fewest moves wins" % level, 12, "#8a7154")
    hud = _Hud(y=214, color="#8a7154")
    hud.say("Maze %d: get to the flag" % level, "#8a7154", 15)
    t = GameTurtle()
    t.shape("turtle")
    t.shapesize(1.6, 1.6)
    t.color("#1f8a5b")
    t.width(3)
    t.walls = list(m["walls"]) + [(-320, TOP, 320, 240)]  # the header strip is out of bounds
    t.goal = (gx, gy, 26)
    t.hud = hud
    t.teleport(sx, sy)
    print("Maze %d. You are at %s, the flag is at %s. Go!" % (level, _pt((sx, sy)), _pt((gx, gy))))
    return t


# ---------- 2. treasure hunt ----------

def treasure():
    """Treasure is buried somewhere. Move about: it says warmer or colder. t.dig() when close."""
    _fresh()
    turtle.bgcolor("#fbf3d5")
    p = _painter()
    for k in range(-240, 241, 80):
        _line(p, k, -240, k, 240, "#efe4bd", 1)
        _text(p, k, -236, str(k), 11, "#b9a76a")
    for k in range(-160, 161, 80):
        _line(p, -320, k, 320, k, "#efe4bd", 1)
        _text(p, -306, k - 6, str(k), 11, "#b9a76a", align="left")
    _frame(p, "#c9a84a")
    _text(p, 0, -232, "treasure hunt · the numbers are coordinates for t.goto(x, y)", 12, "#b9a76a")
    hud = _Hud(y=208, color="#8a6d1f")
    hud.say("Somewhere here is treasure. Move, and watch the clue.", "#8a6d1f", 16)
    tx = random.randint(-220, 220)
    ty = random.randint(-160, 160)
    marks = _painter()

    class TreasureTurtle(GameTurtle):
        last = None
        found = False
        digs = 0

        def __init__(self):
            super().__init__()
            self.last = None
            self.found = False
            self.digs = 0

        def dig(self):
            d = math.hypot(self.xcor() - tx, self.ycor() - ty)
            if self.found:
                print("You already have it. Start a new hunt with treasure().")
                return
            self.digs += 1
            if d <= 30:
                self.found = True
                _disc(marks, tx, ty, 22, "#ffd84a", "#b8860b")
                _text(marks, tx, ty - 12, "💰", 22)
                msg = "🏆 Treasure! Found after %d moves and %d dig%s." % (self.moves, self.digs, "" if self.digs == 1 else "s")
                print(msg)
                hud.say(msg, "#1d8448", 20)
            else:
                x, y = self.xcor(), self.ycor()
                _line(marks, x - 8, y - 8, x + 8, y + 8, "#c42d3a", 3)
                _line(marks, x - 8, y + 8, x + 8, y - 8, "#c42d3a", 3)
                print("⛏️  Nothing here (%d steps away). Dig %d." % (round(d), self.digs))
                hud.say("⛏️ Nothing here. Keep looking.", "#c42d3a")

    t = TreasureTurtle()
    t.shape("turtle")
    t.shapesize(1.6, 1.6)
    t.color("#8a4b1f")
    t.width(2)

    def after(me):
        d = math.hypot(me.xcor() - tx, me.ycor() - ty)
        if me.found:
            return
        if me.last is None:
            word = ""
        elif d < me.last - 1:
            word = "🔥 warmer · "
        elif d > me.last + 1:
            word = "❄️ colder · "
        else:
            word = "same · "
        me.last = d
        if d <= 30:
            heat, color = "VERY HOT! t.dig()", "#c42d3a"
        elif d <= 70:
            heat, color = "hot", "#e5484d"
        elif d <= 130:
            heat, color = "warm", "#e08a1e"
        elif d <= 210:
            heat, color = "cool", "#3a7bd5"
        else:
            heat, color = "cold", "#1f4e9a"
        print(word + heat)
        hud.say("%s%s   (move %d)" % (word, heat, me.moves), color, 20)
    t.on_move = after
    print("The treasure is hidden. Move (t.forward, t.goto ...) and watch for warmer / colder.")
    return t


# ---------- 3. cannon ----------

def cannon():
    """A target sits at a secret angle. Turn with t.left / t.right, then t.fire(). Three shots."""
    _fresh()
    turtle.bgcolor("#e9f2fb")
    p = _painter()
    _ring(p, 0, 0, 200, "#b9cde3", 2)
    for a in range(0, 360, 30):
        x, y = 200 * math.cos(math.radians(a)), 200 * math.sin(math.radians(a))
        _line(p, x * 0.96, y * 0.96, x * 1.04, y * 1.04, "#8ea9c6", 2)
        _text(p, x * 1.13, y * 1.13 - 7, "%d°" % a, 11, "#6b87a6")
    _frame(p, "#9fb8d2")
    angle = random.randint(0, 359)
    tx, ty = 200 * math.cos(math.radians(angle)), 200 * math.sin(math.radians(angle))
    for r, c in ((28, "#e5484d"), (19, "white"), (10, "#e5484d")):
        _disc(p, tx, ty, r, c)
    hud = _Hud(y=-230, color="#2a4d7a")
    hud.say("Aim with t.left() / t.right(), then t.fire(). 0° is right, 90° is up. 3 shots.", "#2a4d7a", 15)
    barrel = _painter()
    shots = _painter()

    class Cannon(GameTurtle):
        shots = 0
        hit = False

        def __init__(self):
            super().__init__()
            self.shots = 0
            self.hit = False

        def _rotate(self, a):
            super()._rotate(a)
            if self._checking is not None and hasattr(self, "shots"):
                self.draw_barrel()

        def draw_barrel(self):
            h = self.heading()
            barrel.clear()
            _disc(barrel, 0, 0, 22, "#333")
            barrel.goto(0, 0)
            barrel.setheading(h)
            barrel.pendown()
            barrel.color("#333")
            barrel.width(14)
            barrel.forward(46)
            barrel.penup()
            barrel.width(1)

        def fire(self):
            if self.hit:
                print("Already hit! cannon() for a new target.")
                return
            if self.shots >= 3:
                print("No shots left. cannon() for a new target.")
                hud.say("No shots left. cannon() for a new target.", "#c42d3a")
                return
            self.shots += 1
            h = self.heading() % 360
            off = (h - angle + 180) % 360 - 180
            shots.goto(0, 0)
            shots.setheading(h)
            shots.pendown()
            shots.color("#e08a1e" if abs(off) > 4 else "#1d8448")
            shots.width(3)
            shots.forward(236)
            shots.penup()
            shots.width(1)
            if abs(off) <= 4:
                self.hit = True
                _text(shots, tx, ty + 34, "💥 HIT!", 20, "#e5484d", bold=True)
                msg = "🎯 HIT on shot %d! The target was at %d°." % (self.shots, angle)
                print(msg)
                hud.say(msg, "#1d8448", 22)
            else:
                where = "left" if off < 0 else "right"
                msg = "Miss by %d°, target is to your %s. Shot %d of 3." % (round(abs(off)), where, self.shots)
                print(msg)
                hud.say(msg, "#c42d3a")

    t = Cannon()
    t.hideturtle()
    t._checking = False
    t.draw_barrel()
    print("Target loaded at a secret angle. Turn, then t.fire(). t.heading() tells you where you point.")
    return t


# ---------- 4. race ----------

RACERS = [("red", "#e5484d"), ("blue", "#3a7bd5"), ("green", "#1f8a5b"), ("purple", "#8e44ad")]
_LAST = {"winner": None}


def last_winner():
    """The colour that won the most recent race (None before any race)."""
    return _LAST["winner"]


def race(bet=None):
    """Four turtles race to the line. Say which one you think wins: race('green')."""
    _fresh()
    turtle.bgcolor("#f3f7ef")
    p = _painter()
    lanes = {c: 105 - 70 * k for k, (c, _) in enumerate(RACERS)}
    for k, (c, hexc) in enumerate(RACERS):
        y = lanes[c]
        _box(p, -300, y - 30, 300, y + 30, "#e4ecdc" if k % 2 else "#eef3e8")
        _text(p, -296, y - 8, c, 14, hexc, align="left", bold=True)
    _line(p, -230, lanes["purple"] - 32, -230, lanes["red"] + 32, "#999", 3)
    for k in range(lanes["purple"] - 32, lanes["red"] + 32, 12):
        _box(p, 236, k, 248, k + 6, "#222")
        _box(p, 248, k + 6, 260, k + 12, "#222")
    _text(p, 248, lanes["red"] + 38, "finish", 11, "#555")
    _frame(p, "#9fb58a")
    hud = _Hud(y=208, color="#2f4f2f")
    names = [c for c, _ in RACERS]
    if bet and bet not in names:
        print("Pick one of:", ", ".join(names))
        bet = None
    hud.say("🏁 They're off!" + (" You bet on %s." % bet if bet else ""), "#2f4f2f", 18)
    turtles = {}
    for c, hexc in RACERS:
        u = turtle.Turtle()
        u.shape("turtle")
        u.shapesize(1.5, 1.5)
        u.color(hexc)
        u.penup()
        u.goto(-250, lanes[c])
        turtles[c] = u
    winner = None
    turns = 0
    while winner is None and turns < 200:
        turns += 1
        for c, u in turtles.items():
            u.forward(random.randint(2, 14))
            if u.xcor() >= 236 and winner is None:
                winner = c
    _LAST["winner"] = winner
    hexc = dict(RACERS)[winner]
    msg = "🏁 %s wins after %d turns!" % (winner, turns)
    print(msg)
    if bet:
        line = "🎉 You bet on %s. You win!" % bet if bet == winner else "You bet on %s. Better luck next time." % bet
        print(line)
        hud.say(msg + "  " + line, hexc, 18)
    else:
        hud.say(msg, hexc, 22)
    print("last_winner() remembers who won.")


# ---------- 5. golf ----------

HOLES = {
    1: {"tee": (-230, 0), "hole": (230, 0), "water": [], "sand": [(0, -120, 120, -60)]},
    2: {"tee": (-230, -140), "hole": (210, 150), "water": [(-50, -70, 70, 70)], "sand": []},
    3: {"tee": (-230, 170), "hole": (230, -170), "water": [(-130, -50, -30, 210), (40, -210, 150, 30)], "sand": [(150, 100, 260, 160)]},
}


def golf(hole=1):
    """Turtle golf. ball.forward(...) and turns are strokes; get the ball in the hole in the
    fewest. Water sends the ball back to the tee with a penalty stroke."""
    h = HOLES.get(hole, HOLES[1])
    _fresh()
    turtle.bgcolor("#a9d18e")
    p = _painter()
    # the fairway, lighter, and a rough border
    _box(p, -290, -210, 290, 210, "#bfe3a3", "#8fbf74")
    for s in h.get("sand", []):
        _box(p, *s, fill="#f1dd9a", outline="#d9c06a")
    for w in h["water"]:
        _box(p, *w, fill="#7fb8e6", outline="#4f8fc4")
        x1, y1, x2, y2 = w
        for yy in range(int(min(y1, y2)) + 14, int(max(y1, y2)) - 6, 18):
            for xx in range(int(min(x1, x2)) + 10, int(max(x1, x2)) - 18, 28):
                _line(p, xx, yy, xx + 10, yy + 4, "#dff0fb", 2)
    _frame(p, "#6f9f58")
    tx, ty = h["tee"]
    _box(p, tx - 14, ty - 14, tx + 14, ty + 14, "#d9efc9", "#8fbf74")
    _text(p, tx, ty - 40, "tee", 11, "#4f7f3a")
    hx, hy = h["hole"]
    _disc(p, hx, hy, 14, "#222")
    _flag(p, hx, hy + 14, "#ffd84a")
    _text(p, 0, 218, "hole %d · every forward and every turn is a stroke · water = back to the tee, +1" % hole, 12, "#4f7f3a")
    hud = _Hud(y=-232, color="#2f5f1f")
    hud.say("Hole %d. Fewest strokes wins." % hole, "#2f5f1f", 16)

    class Ball(GameTurtle):
        strokes = 0
        done = False

        def __init__(self):
            super().__init__()
            self.strokes = 0
            self.done = False

        def _rotate(self, a):
            super()._rotate(a)
            if self._checking and not self.done and abs(a) > 1e-9:
                self.strokes += 1
                hud.say("Stroke %d: turned to %d°" % (self.strokes, round(self.heading())), "#2f5f1f", 16)

        def _goto(self, end):
            start = (self._position[0], self._position[1])
            if not self._checking or (abs(end[0] - start[0]) < 1e-9 and abs(end[1] - start[1]) < 1e-9):
                return turtle.Turtle._goto(self, end)
            if self.done:
                print("The ball is in the hole. golf(%d) to play again." % hole)
                return
            self.strokes += 1
            ex, ey = end[0], end[1]
            dist = math.hypot(ex - start[0], ey - start[1])
            steps = max(1, int(dist / 3))
            for k in range(1, steps + 1):
                f = k / steps
                x, y = start[0] + (ex - start[0]) * f, start[1] + (ey - start[1]) * f
                if math.hypot(x - hx, y - hy) <= 14:
                    turtle.Turtle._goto(self, turtle.Vec2D(hx, hy))
                    self.done = True
                    self.hideturtle()
                    msg = "⛳ In the hole in %d stroke%s!" % (self.strokes, "" if self.strokes == 1 else "s")
                    print(msg)
                    hud.say(msg, "#1d8448", 22)
                    return
                if abs(x) > 300 or abs(y) > 220:
                    turtle.Turtle._goto(self, turtle.Vec2D(x, y))
                    print("Out of bounds! Stroke %d: the ball stopped at the edge, %s." % (self.strokes, _pt((x, y))))
                    hud.say("Out of bounds · stroke %d" % self.strokes, "#c42d3a")
                    return
                for x1, y1, x2, y2 in h["water"]:
                    if min(x1, x2) <= x <= max(x1, x2) and min(y1, y2) <= y <= max(y1, y2):
                        turtle.Turtle._goto(self, turtle.Vec2D(x, y))
                        _text(p, x, y + 10, "💦", 18)
                        self.strokes += 1
                        print("💦 Splash! Back to the tee, plus one. Strokes so far: %d." % self.strokes)
                        hud.say("💦 Splash! Back to the tee · strokes: %d" % self.strokes, "#c42d3a")
                        self.teleport(tx, ty)
                        return
            turtle.Turtle._goto(self, turtle.Vec2D(ex, ey))
            d = math.hypot(ex - hx, ey - hy)
            print("Stroke %d: the ball is at %s, %d from the hole." % (self.strokes, _pt((ex, ey)), round(d)))
            hud.say("Stroke %d · %d from the hole" % (self.strokes, round(d)), "#2f5f1f", 16)

    b = Ball()
    b.shape("circle")
    b.shapesize(0.9, 0.9)
    b.color("#444", "white")
    b.width(2)
    b.pencolor("#ffffff")
    b.teleport(tx, ty)
    print("Hole %d. The ball is at %s, the hole at %s. ball.forward(...) to hit it." % (hole, _pt((tx, ty)), _pt((hx, hy))))
    return b


# ---------- 6. art ----------

def art(seed=None):
    """A random spirograph. art() for a new one; art(7) repeats number 7."""
    if seed is None:
        seed = random.randint(1, 9999)
    rnd = random.Random(seed)
    _fresh()
    turtle.bgcolor(rnd.choice(["white", "black", "#101830", "#fff7e6", "#0b2a2a"]))
    palette = rnd.choice([
        ["red", "orange", "gold", "green", "blue", "purple"],
        ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff"],
        ["deeppink", "orchid", "mediumpurple", "royalblue", "turquoise"],
        ["#f94144", "#f3722c", "#f8961e", "#f9c74f", "#90be6d", "#43aa8b", "#577590"],
        ["#ffffff", "#c0c0c0", "#808080"],
    ])
    t = turtle.Turtle()
    t.hideturtle()
    t.width(rnd.choice([1, 2, 3]))
    sides = rnd.randint(3, 8)
    size = rnd.randint(60, 140)
    turn = rnd.choice([5, 10, 12, 15, 20, 30])
    n = 360 // turn
    for i in range(n):
        t.color(palette[i % len(palette)])
        for j in range(sides):
            t.forward(size)
            t.left(360 / sides)
        t.left(turn)
    print("Art #%d: %d-sided shape, size %d, turned %d° %d times. art() for a new one, art(%d) for this one again." % (seed, sides, size, turn, n, seed))
    return seed
