// Slot Racer: the game. index.html runs the lobby (A joins), the seats and the
// loop, and calls the hooks below. The sample is a slot-car race: every car
// runs in a lane of an oval. Hold A for gas, B brakes, left and right change
// lanes (left = outward, right = inward: the race runs clockwise). Each lane
// has a safe corner speed: the inside lane is shorter but tighter. Go into a
// corner too fast and you spin. Five laps; new players join the next race.
// Replace it with your game.
//
// Drawing: Phaser 3.90 (WebGL) on a 960x540 canvas that Phaser scales to fit.
//   Textures are painted ONCE on a plain canvas and added with
//   textures.addImage (never addCanvas: it reads every pixel back); sprites
//   are made once and reused; text changes only when its words change.
//   https://okonaonline.com/developers/docs.html#phaser
// Pads: pad.axes.lx/ly (-1..1, +Y down), pad.buttons.a/b/x/y/lb/rb/lt/rt/
//   select/l3/r3/up/down/left/right, pad.justPressed('a'), pad.triggers.lt/rt
//   (0..1), pad.parked (controller away: seat held). Start and Home are
//   Okona's and never reach the game.
// Saves: Okona.save.get/set keep data for the player's account on any screen
//   (the sample keeps the best lap). https://okonaonline.com/developers/docs.html#saves
var Game = {
  title: 'Slot Racer',
  subtitle: 'Hold A for gas, left and right to change lanes. Lift before the corners!',
  // Emoji (or a path to an image in this folder) shown on each player's phone.
  icons: ['🏎️', '🏎️', '🏎️', '🏎️', '🏎️', '🏎️'],
  LAPS: 5,
  TOP_SPEED: 330,         // px/s
  GRIP: 360,              // safe corner speed = sqrt(GRIP * lane radius)
  CX: 480, CY: 290, L: 400, R: 160,          // the oval: straight length and corner radius
  LANES: [-26, 0, 26],    // lane offsets from the centre line (negative = inside)

  // ---- set up once: textures, the track, a car sprite per seat --------------
  create: function (scene, W, H) {
    this.scene = scene;
    this.P = 2 * this.L + 2 * Math.PI * this.R;   // centre-line length of one lap
    var self = this;
    this.paint('track', W, H, function (g) { self.paintTrack(g, W, H); });
    this.paint('car', 30, 16, function (g) {      // white: each car is tinted with its player's colour
      g.fillStyle = '#FFFFFF'; g.fillRect(2, 1, 26, 14);
      g.fillStyle = '#20262E'; g.fillRect(17, 3, 6, 10); g.fillRect(0, 0, 4, 4); g.fillRect(0, 12, 4, 4); g.fillRect(24, 0, 5, 3); g.fillRect(24, 13, 5, 3);
    });
    this.layer = scene.add.container(0, 0);
    this.layer.add(scene.add.image(0, 0, 'track').setOrigin(0, 0));
    this.cars = [];
    for (var i = 0; i < 6; i++) {
      var sprite = scene.add.image(0, 0, 'car').setVisible(false);
      this.layer.add(sprite);
      this.cars.push({ sprite: sprite });
    }
    // The infield: the countdown, a line per racer, the best lap. Text objects are made once.
    var font = { fontFamily: 'system-ui, sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#FFFFFF' };
    this.banner = scene.add.text(this.CX, this.CY - 88, '', { fontFamily: 'system-ui, sans-serif', fontSize: '34px', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
    this.info = scene.add.text(this.CX, this.CY + 84, '', { fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#A0B4C8', align: 'center' }).setOrigin(0.5);
    this.layer.add([this.banner, this.info]);
    this.board = [];
    for (var k = 0; k < 6; k++) { this.board.push(scene.add.text(this.CX, this.CY - 52 + k * 22, '', font).setOrigin(0.5)); this.layer.add(this.board[k]); }
  },
  // A texture painted once with Canvas 2D, then handed to the GPU.
  paint: function (key, w, h, fn) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    fn(c.getContext('2d'));
    this.scene.textures.addImage(key, c);
  },
  ovalPath: function (g, d) {     // the oval at lane offset d
    var r = this.R + d, x0 = this.CX - this.L / 2, x1 = this.CX + this.L / 2;
    g.beginPath();
    g.moveTo(x0, this.CY - r); g.lineTo(x1, this.CY - r);
    g.arc(x1, this.CY, r, -Math.PI / 2, Math.PI / 2);
    g.lineTo(x0, this.CY + r);
    g.arc(x0, this.CY, r, Math.PI / 2, Math.PI * 1.5);
    g.closePath();
  },
  paintTrack: function (g, W, H) {
    g.fillStyle = '#2E5E3A'; g.fillRect(0, 0, W, H);
    g.lineJoin = 'round';
    g.strokeStyle = '#D9D9D9'; g.lineWidth = 104; this.ovalPath(g, 0); g.stroke();   // kerbs
    g.strokeStyle = '#3A3F47'; g.lineWidth = 94; this.ovalPath(g, 0); g.stroke();    // tarmac
    g.strokeStyle = '#59606B'; g.lineWidth = 2; g.setLineDash([10, 12]);
    this.ovalPath(g, -13); g.stroke(); this.ovalPath(g, 13); g.stroke();             // lane lines
    g.setLineDash([]);
    for (var k = 0; k < 10; k++) {                                                  // the start line
      g.fillStyle = k % 2 ? '#FFFFFF' : '#111111';
      g.fillRect(this.CX - 4, this.CY - this.R - 47 + k * 9.4, 8, 9.4);
    }
  },

  // ---- players ---------------------------------------------------------------
  onJoin: function (player, pad, racing) { player.waiting = racing; },   // mid-race: joins the next race
  onLeave: function (player, pad) { this.cars[player.index].sprite.setVisible(false); },

  // ---- a race ------------------------------------------------------------------
  start: function (players, pads) {
    this.best = Okona.save.get('bestLap', 0);   // the best lap on this account, kept by Okona
    this.finished = 0; this.winnerAt = 0;
    var grid = 0;
    for (var i = 0; i < 6; i++) {
      var car = this.cars[i], p = players[i];
      p.waiting = false;
      car.racing = p.joined;
      car.sprite.setVisible(car.racing).setTint(p.tint).setAlpha(1);
      if (!car.racing) continue;
      car.lane = grid % 3; car.d = this.LANES[car.lane];
      car.s = this.P - 40 - Math.floor(grid / 3) * 44;   // the grid, behind the line: rows of three
      car.lap = 0; car.v = 0; car.spin = 0; car.turn = 0; car.held = 0;
      car.lapStart = 2; car.bestLap = 0; car.finishTime = 0;
      grid++;
      this.place(car);
    }
    for (var b = 0; b < 6; b++) this.board[b].setText('');
  },
  // Where a car is: the centre line runs clockwise from the start line (top middle).
  place: function (car) {
    var s = ((car.s % this.P) + this.P) % this.P, L = this.L, R = this.R, r = R + car.d, x, y, a;
    var half = L / 2, arc = Math.PI * R;
    if (s < half) { x = this.CX + s; y = this.CY - r; a = 0; }
    else if (s < half + arc) { a = (s - half) / R; x = this.CX + half + r * Math.sin(a); y = this.CY - r * Math.cos(a); }
    else if (s < half + arc + L) { x = this.CX + half - (s - half - arc); y = this.CY + r; a = Math.PI; }
    else if (s < half + 2 * arc + L) { a = (s - half - arc - L) / R; x = this.CX - half - r * Math.sin(a); y = this.CY + r * Math.cos(a); a += Math.PI; }
    else { x = this.CX - half + (s - half - 2 * arc - L); y = this.CY - r; a = 0; }
    car.inCorner = (s >= half && s < half + arc) || (s >= half + arc + L && s < half + 2 * arc + L);
    car.sprite.setPosition(x, y).setRotation(a + car.turn);
  },

  // Return true when the race is over.
  update: function (dt, players, pads, elapsed) {
    var GO = 2, racers = 0, home = 0, time = elapsed - GO;
    for (var i = 0; i < 6; i++) {
      var car = this.cars[i], pad = pads[i], p = players[i];
      if (!car.racing || !p.joined) continue;
      var here = pad.connected && !pad.parked;
      car.sprite.setAlpha(here ? 1 : 0.35);          // away: a ghost that waits; it never holds up the race
      if (here) racers++;
      if (car.finishTime) { home += here ? 1 : 0; continue; }
      if (!here || time < 0) continue;
      // lanes: hold left/right to keep moving over, one lane every 0.25 s
      var dir = pad.buttons.right || pad.axes.lx > 0.5 ? -1 : pad.buttons.left || pad.axes.lx < -0.5 ? 1 : 0;
      car.held = dir ? car.held - dt : 0;
      if (dir && car.held <= 0 && car.spin <= 0) { car.lane = Math.max(0, Math.min(2, car.lane + dir)); car.held = 0.25; }
      var want = this.LANES[car.lane];
      car.d += Math.max(-dt * 140, Math.min(dt * 140, want - car.d));
      // speed: gas, brake, or the motor drags it down
      var gas = Math.max(pad.buttons.a ? 1 : 0, pad.triggers.rt);
      if (car.spin > 0) { car.spin -= dt; car.turn += dt * 14; car.v *= Math.pow(0.2, dt); if (car.spin <= 0) car.turn = 0; }
      else if (pad.buttons.b) car.v = Math.max(0, car.v - 600 * dt);
      else if (gas) car.v = Math.min(this.TOP_SPEED, car.v + 260 * gas * dt);
      else car.v = Math.max(0, car.v - 220 * dt);
      // too fast for this lane's corner: spin
      if (car.inCorner && car.spin <= 0 && car.v > Math.sqrt(this.GRIP * (this.R + car.d)) * 1.08) {
        car.spin = 0.9; car.v *= 0.4;
        Okona.rumble(pad, 0.8, 0.4);
      }
      // move along the centre line: an inside lane covers ground faster in the corners
      var before = car.s;
      car.s += car.v * dt * (car.inCorner ? this.R / (this.R + car.d) : 1);
      if (Math.floor(car.s / this.P) > Math.floor(before / this.P)) this.lapDone(car, p, time);
      this.place(car);
    }
    this.drawBoard(players, pads);
    this.banner.setText(time < 0 ? String(Math.ceil(-time)) : time < 1 ? 'GO!' : '');
    this.info.setText(time < 0 ? this.LAPS + ' laps' : 'Best lap ' + (this.best ? this.best.toFixed(2) + ' s' : '-') + this.waitingLine(players));
    // over when every racer who is here is home, or 15 s after the winner
    return (racers > 0 && home === racers) || (this.winnerAt && time - this.winnerAt > 15) || racers === 0 && time > 0;
  },
  // One line per racer, in seat order; setText only redraws a line whose words changed.
  drawBoard: function (players, pads) {
    var row = 0;
    for (var i = 0; i < 6; i++) {
      var car = this.cars[i], p = players[i];
      if (!car.racing || !p.joined) continue;
      var here = pads[i].connected && !pads[i].parked;
      this.board[row].setText(p.name + '   ' + (car.finishTime ? 'home ' + car.finishTime.toFixed(2) + ' s'
        : !here ? 'away' : 'lap ' + Math.max(1, Math.min(car.lap, this.LAPS)) + ' / ' + this.LAPS));
      if (this.board[row].style.color !== p.color) this.board[row].setColor(p.color);   // setColor redraws: only on a change
      row++;
    }
  },
  waitingLine: function (players) {
    var names = players.filter(function (p) { return p.joined && p.waiting; }).map(function (p) { return p.name; });
    return names.length ? '\n' + names.join(', ') + ' joining the next race' : '';
  },
  lapDone: function (car, player, time) {
    car.lap++;
    if (car.lap === 1) { car.lapStart = time; return; }    // crossing the line from the grid starts lap 1
    var lapTime = time - car.lapStart;
    car.lapStart = time;
    if (!car.bestLap || lapTime < car.bestLap) car.bestLap = lapTime;
    if (!this.best || lapTime < this.best) { this.best = lapTime; Okona.save.set('bestLap', Math.round(lapTime * 100) / 100); }
    if (car.lap > this.LAPS) {
      car.finishTime = time; car.v = 0;
      if (!this.winnerAt) this.winnerAt = time;
      Okona.save.flush();
    }
  },

  // ---- results: one line per racer, best first ---------------------------------
  results: function (players) {
    var cars = this.cars, rows = [];
    for (var i = 0; i < 6; i++) if (cars[i].racing && players[i].joined) rows.push(i);
    rows.sort(function (a, b) {
      var A = cars[a], B = cars[b];
      if (A.finishTime && B.finishTime) return A.finishTime - B.finishTime;
      if (A.finishTime || B.finishTime) return A.finishTime ? -1 : 1;
      return B.s - A.s;                                     // unfinished: placed by distance
    });
    return rows.map(function (i, place) {
      var c = cars[i];
      return { color: players[i].color, text: (place + 1) + '.  ' + players[i].name + '   ' +
        (c.finishTime ? c.finishTime.toFixed(2) + ' s' : 'did not finish') + (c.bestLap ? '   best lap ' + c.bestLap.toFixed(2) + ' s' : '') };
    });
  },
  show: function (on) { this.layer.setVisible(on); }
};
