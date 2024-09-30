// adapted from https://github.com/hallettj/Fuzzy-Text-International/
{
  const SETTINGS_FILE = "fuzzyw.settings.json";

  let fuzzy_string = {
    "hours":[
      /*LANG*/"twelve",
      /*LANG*/"one",
      /*LANG*/"two",
      /*LANG*/"three",
      /*LANG*/"four",
      /*LANG*/"five",
      /*LANG*/"six",
      /*LANG*/"seven",
      /*LANG*/"eight",
      /*LANG*/"nine",
      /*LANG*/"ten",
      /*LANG*/"eleven"
    ],
    "minutes":[
      /*LANG*/"*$1 o'clock",
      /*LANG*/"five past *$1",
      /*LANG*/"ten past *$1",
      /*LANG*/"quarter past *$1",
      /*LANG*/"twenty past *$1",
      /*LANG*/"twenty five past *$1",
      /*LANG*/"half past *$1",
      /*LANG*/"twenty five to *$2",
      /*LANG*/"twenty to *$2",
      /*LANG*/"quarter to *$2",
      /*LANG*/"ten to *$2",
      /*LANG*/"five to *$2"
    ]
  };

  let text_scale = 5;
  let timeout = 5*60;
  let drawTimeout;
  let time_string = "";
  let time_string_old = "";
  let time_string_old_wrapped = "";
  let settings = {};

  let loadSettings = function() {
    settings = require("Storage").readJSON(SETTINGS_FILE,1)|| {'showWidgets': false};
  };

  let queueDraw = function(seconds) {
    let millisecs = seconds * 1000;
    if (drawTimeout) clearTimeout(drawTimeout);
    drawTimeout = setTimeout(function() {
      drawTimeout = undefined;
      draw();
    }, millisecs - (Date.now() % millisecs));
  };

  // const roundToNearest5 = x => Math.round(x / 5) * 5

  let getTimeString = function(date) {
    // let segment = roundToNearest5(date.getMinutes()) * 60 / 300; works, but the below changes at second 30
    let segment = Math.round((date.getMinutes()*60 + date.getSeconds() + 1)/300);
    let hour = date.getHours() + Math.floor(segment/12);
    // add "" to load into RAM due to 2v21 firmware .replace on flashstring issue
    let f_string = ""+fuzzy_string.minutes[segment % 12];
    if (f_string.includes('$1')) {
      f_string = f_string.replace('$1', fuzzy_string.hours[(hour) % 12]);
    } else {
      f_string = f_string.replace('$2', fuzzy_string.hours[(hour + 1) % 12]);
    }
    return f_string;
  };

  let draw = function() {
    time_string = getTimeString(new Date()).replace('*', '');
    print(time_string + " " + time_string_old);
    if (time_string !== time_string_old) {
      g.setFont('Vector', R.h/text_scale).setFontAlign(0, 0);
      print("draw");
      doDraw();
      time_string_old = time_string;
      queueDraw(timeout);
    } else {
      print("quick d");
      queueDraw(5);
    }
  };

  let doDraw = function() {
    let time_string_new_wrapped = g.wrapString(time_string, R.w).join("\n");
    g.setColor(g.theme.bg);
    g.drawString(time_string_old_wrapped, R.x + R.w/2, R.y + R.h/2);
    g.setColor(g.theme.fg);
    g.drawString(time_string_new_wrapped, R.x + R.w/2, R.y + R.h/2);
    time_string_old_wrapped = time_string_new_wrapped;
  };

  g.clear();
  loadSettings();

  // Stop updates when LCD is off, restart when on
  Bangle.on('lcdPower',on=>{
    if (on) {
      draw(); // draw immediately, queue redraw
    } else { // stop draw timer
      if (drawTimeout) clearTimeout(drawTimeout);
      drawTimeout = undefined;
    }
  });

  Bangle.setUI({
    mode : 'clock',
    remove : function() {
      // Called to unload all of the clock app
      if (drawTimeout) clearTimeout(drawTimeout);
      drawTimeout = undefined;
      require('widget_utils').show(); // re-show widgets
    }
  });

  Bangle.loadWidgets();
  if (settings.showWidgets) {
    Bangle.drawWidgets();
  } else {
    require("widget_utils").swipeOn(); // hide widgets, make them visible with a swipe
  }

  let R = Bangle.appRect;
  draw();
  queueDraw(2.5 * 60);
}
