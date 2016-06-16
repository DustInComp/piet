/**
 * Burries the last value in the array to be the n'th last value.
 * Used by the Roll stack op.
 */
Array.prototype.bury = function ( n ) {
  if (n < 0) return digUp( -n );
  if (n <= this.length) {
    section = this.splice(this.length - n, n-1);
    while (section.length > 0)
      this.push( section.shift() );
  }
  return this.valueOf();
};

Array.prototype.digUp = function ( n ) {
  if (n < 0) return bury( -n );
  this.push( this.splice( this.length - n, 1 )[0] );
  return this.valueOf();
};

function Codel(x, y, colorId) {
  this.x = x;
  this.y = y;
  this.colorId = colorId;
}

function ColorBlock( colorId ) {
  this.colorId = colorId;
  this.codels = [];
  this.count = 0;
}

function PietImage(width, height) {
  this.width = width;
  this.height = height;
  this.matrix = (function(){
    var arr = [];
    for (var x = 0; x < width; x++) {
      arr.push( [] );
      for (var y = 0; y < height; y++)
        arr[x].push( new Codel(x, y, 19) );
    }
    return arr;
  })();
}

/**
 * Array of 18(-1) functions where the functions' 2d indexes equal
 * [hue change][darkness change]
 */
var stackOperations = [
  [ // None, Push, Pop
    function(){},
    function( stack, blockSize ) { stack.push( blockSize ); },
    function( stack ) { stack.pop(); } ],
  [ // Add, Subtract, Multiply
    function( stack ) {
      if (stack.length >= 2)
        stack.push( stack.pop()+stack.pop() ); },
    function( stack ) {
      if (stack.length >= 2)
        stack.push( -stack.pop()+stack.pop() ); },
    function( stack ) {
      if (stack.length >= 2)
        stack.push( stack.pop()*stack.pop() ); } ],
  [ // Divide, Mod, Not
    function( stack ) {
      if (stack.length >= 2) {
        var num1 = stack.pop(),
            num2 = stack.pop();
        if (num1 != 0) stack.push( num2/num1 |0 )
        else alert( "Better not try to div/0" ); } },
    function( stack ) {
      if (stack.length >= 2) {
        var num1 = stack.pop(),
            num2 = stack.pop();
        if (num1 != 0) stack.push( num2%num1 )
        else alert( "You shall not div/0" ); } },
    function( stack ) {
      if (stack.length >= 1)
        stack.push( stack.pop()===0 ? 1 : 0 ); } ],
  [ // Greater, Pointer, Switch
    function( stack ) {
      if (stack.length >= 2)
        stack.push( stack.pop() <= stack.pop() ? 1 : 0 ); },
    function( stack ) {
      if (stack.length >= 1)
        directionPointer = (directionPointer + stack.pop()) % 4; },
    function( stack ) {
      if (stack.length >= 1)
        if ( stack.pop() % 2 === 1 )
          codelChooser *= -1; } ],
  [ // Duplicate, Roll, Int In
    function( stack ) {
      if (stack.length >= 1)
        stack.push( stack[stack.length-1] ); },
    function( stack ) {
      if ( stack.length > 2 ) {
        var num1 = stack.pop(), // Number of rolls
            num2 = stack.pop(); // Depth of roll
        if ( num2 <= 0 ) {
          alert( "Roll depth has to be at least 1" );
          return; }
        if ( num2 > stack.length ) {
          alert( "Roll depth can't be deeper than remaining stack's length" );
          return; }
        if ( num1 === 0 ) return;

        while ( num1 --> 0 )
          if ( num2 > 0 ) stack.bury( num2 )
          else stack.digUp( num2 ); } },
    function( stack ) { stack.push( inputBuffer.readInt() ); } ],
  [ // Char In, Int Out, Char Out
    function( stack ) { stack.push( inputBuffer.readChar() ); },
    function( stack ) {
      if (stack.length >= 1)
        outputArea.print( stack.pop() );
      else alert( "Int-Out Error: Stack is so goddamn empty rn." ) },
    function( stack ) {
      if (stack.length >= 1 && (num = stack.pop()) >= 32)
        outputArea.print( String.fromCharCode( num )) ; } ]
];

function updateStack() {
  stackArea.value = pietStack.map( (e)=>e ).reverse().join("\n");
}

function doStackOperation(hueChange, darknessChange, colorBlockSize) {
  stackOperations[hueChange][darknessChange](pietStack, colorBlockSize);
  updateStack();
}

function drawCanvasGrid() {
  if (codelSize <= 1) {
    gridC.hidden = true;
  } else with ( gridCtx ) {
    gridC.hidden = false;
    lineWidth = 1;

    if (codelSize < 10) {
      // draw dots
      fillStyle = "#808080";
      for (var x = 1; x <= pietWidth; x++)
      for (var y = 1; y <= pietHeight; y++)
        fillRect( x*codelSize - 1, y*codelSize - 1, 1, 1 );
    } else {
      // draw lines
      fillStyle = "#e0e0e0";
      for (var x = 1; x <= pietWidth; x++) {
        fillRect( x*codelSize - 1, 0, 1, pietHeight*codelSize );
      }
      for (var y = 1; y <= pietHeight; y++) {
        fillRect( 0, y*codelSize - 1, pietWidth*codelSize, 1 );
      }
    }
  }
}

function resizeCanvas() {
  c.style.height = c.height = gridC.style.height = gridC.height
    = parseInt(pietHeight) * parseInt(codelSize);
  c.style.width = c.width = gridC.style.width = gridC.width
    = parseInt(pietWidth) * parseInt(codelSize);
}

function clearGrid() {
  with (gridCtx) {
    clearRect( 0, 0, canvas.width, canvas.height );
  }
}

function clearImage() {
  with (ctx) {
    fillStyle = "#ffffff";
    fillRect( 0, 0, canvas.width, canvas.height );
  }
}

function drawImage() {
  pietImage.matrix.map((row,x)=>row.map((codel,y)=>{ paintOnImage(x,y,pietColors[codel.colorId]) }));
}

function resetCanvas() {
  resizeCanvas();
  clearImage();
  clearGrid();
  drawImage();
  drawCanvasGrid();
}

function paintOnImage( x, y, color ) {
  with ( ctx ) {
    fillStyle = color;
    fillRect( x*codelSize, y*codelSize, codelSize, codelSize );
  }
}

function selectColor( colorId ) {
  selectedColorId = colorId;
}

function findColorBlock( _x, _y ) {
  var data = pietImage.matrix, // reference to Codel data
    colorBlock = new ColorBlock( data[_x][_y].colorId ),
    codelsChecked = [ data[_x][_y] ],

  checkCodel = function( codel ) {
    if (codel.colorId == colorBlock.colorId) {
      // Add codel to set; push() returns new length of Array
      colorBlock.count = colorBlock.codels.push( codel );

      with(codelsChecked) with(codel) {
        if ( x>=1 && indexOf(data[x-1][y]) === -1 )
          push( data[x-1][y] );
        if ( y>=1 && indexOf(data[x][y-1]) === -1 )
          push( data[x][y-1] );
        if ( x<data.length-1 && indexOf(data[x+1][y]) === -1 )
          push( data[x+1][y] );
        if ( y<data[0].length-1 && indexOf(data[x][y+1]) === -1 )
          push( data[x][y+1] ); }
    }
  };

  var i = 0;
  while (i < codelsChecked.length) checkCodel( codelsChecked[i++] );

  return colorBlock;
}

function determineNextCodel( codeBlock ) {
  var dP = directionPointer,
    cC = codelChooser,
    sP = (directionPointer + codelChooser) < 0 ?
      directionPointer + codelChooser + 4 :
      (directionPointer + codelChooser) % 4,
    edgeCodel,
    passedWhite = false;

  /**
   * This reduce statement looks for the codel that is primarily furthest in the
   * direction of the direction pointer (see initialize function), and sendarily
   * furthest in the direction of the codel chooser.
   * The codel chooser differs from the direction pointer by 90 degrees,
   * clockwise or anti-clockwise.
   */
  edgeCodel = codeBlock.codels.reduce( (prev, curr) =>
    // directionPointer points right
    (dP === 0) && (
      curr.x > prev.x ||
      curr.x === prev.x && (
        // codelChooser points right: sP points down
        sP === 1 && curr.y > prev.y ||
        // codelChooser points left: sP points up
        sP === 3 && curr.y < prev.y
      )
    ) ||
    (dP === 1) && ( // dP points down
      curr.y > prev.y ||
      curr.y === prev.y && (
        sP === 2 && curr.x < prev.x || // sP points left
        sP === 0 && curr.x > prev.x   // sP points right
      )
    ) ||
    (dP === 2) && ( // dP points left
      curr.x < prev.x ||
      curr.x === prev.x && (
        sP === 3 && curr.y < prev.y || // sP points up
        sP === 1 && curr.y > prev.y   // sP points down
      )
    ) ||
    (dP === 3) && ( // dP points up
      curr.y < prev.y ||
      curr.y === prev.y && (
        sP === 0 && curr.x > prev.x || // sP points right
        sP === 2 && curr.x < prev.x   // sP points left
      )
    ) ? curr : prev
  );

  if (dP === 0) {
    for (var i = edgeCodel.x + 1; i < pietImage.matrix.length; i++ )
      with (pietImage.matrix[i][edgeCodel.y]) {
        if (colorId < 18) {
          edgeCodel = pietImage.matrix[i][edgeCodel.y];
          break; }
        if (colorId === 19)
          passedWhite = true;
        if (colorId === 18)
          break;
      }
  }
  if (dP === 1) {
    for (var i = edgeCodel.y + 1; i < pietImage.matrix[0].length; i++ )
      with (pietImage.matrix[edgeCodel.x][i]) {
        if (colorId < 18) {
          edgeCodel = pietImage.matrix[edgeCodel.x][i];
          break; }
        if (colorId === 19)
          passedWhite = true;
        if (colorId === 18)
          break;
      }
  }
  if (dP === 2) {
    for (var i = edgeCodel.x - 1; i >= 0; i-- )
      with (pietImage.matrix[i][edgeCodel.y]) {
        if (colorId < 18) {
          edgeCodel = pietImage.matrix[i][edgeCodel.y];
          break; }
        if (colorId === 19)
          passedWhite = true;
        if (colorId === 18)
          break;
      }
  }
  if (dP === 3) {
    for (var i = edgeCodel.y - 1; i >= 0; i-- )
      with (pietImage.matrix[edgeCodel.x][i]) {
        if (colorId < 18) {
          edgeCodel = pietImage.matrix[edgeCodel.x][i];
          break; }
        if (colorId === 19)
          passedWhite = true;
        if (colorId === 18)
          break;
      }
  }

  // make path visible
  with ( gridCtx ) {
    lineTo( (edgeCodel.x+.2+(.5*(dP==0||sP==0))+.1*Math.random())*codelSize,
      (edgeCodel.y+.2+(.5*(dP==1||sP==1))+.1*Math.random())*codelSize );
    stroke();
  }

  return [edgeCodel, passedWhite];
}

function executeStep() {
  if (codelPointer == null) {
    codelPointer = [0, 0];

    resetCanvas();
    gridCtx.moveTo( .2*codelSize, .2*codelSize );

    return;
  }

  var prevBlock = findColorBlock( codelPointer[0], codelPointer[1] ),
    prevHue = prevBlock.colorId/3 |0,
    prevDrk = prevBlock.colorId % 3,
    nextLocation = determineNextCodel(prevBlock),
    nextCodel = nextLocation[0],
    passedWhite = nextLocation[1];
  console.log("from", prevBlock, prevHue, prevDrk);

  with ( nextCodel )
    codelPointer = [x, y];

  if ( prevBlock.codels.indexOf(nextCodel) === -1 ) {
    var currBlock = findColorBlock( codelPointer[0], codelPointer[1] ),
      currHue = currBlock.colorId/3 |0,
      currDrk = currBlock.colorId % 3;
      console.log("to", currBlock, currHue, currDrk);

    initialPointerAndChooser = [directionPointer, codelChooser];

    if ( !passedWhite )
      doStackOperation(
        (currHue-prevHue)<0 ? currHue-prevHue+6 : currHue-prevHue,
        (currDrk-prevDrk)<0 ? currDrk-prevDrk+3 : currDrk-prevDrk,
        prevBlock.count );
  } else {
    codelChooser *= -1;
    if (codelChooser == -1)
      directionPointer = (directionPointer + 1) % 4;

    console.log( "Direction changed: " +
      ["right","down","left","up"][directionPointer] + " " +
      (codelChooser === -1 ? "(left)" : "(right)"));

    // Pointer in a loop (Next codel can't be found)
    if ( directionPointer === initialPointerAndChooser[0] &&
    codelChooser === initialPointerAndChooser[1] ) {
      alert("Program finished.");
      resetExecution();
    }
  }
}

function finishExecution() {
  do {
    executeStep();
  } while (codelPointer !== null);
}

function resetExecution() {
  outputArea.domEl.value = "";

  codelPointer = null;

  directionPointer = 0;
  codelChooser = -1;
  pietStack = [];
  updateStack();
}

function initialize() {
  window.inputBuffer = {
    domEl: document.getElementById("input-buffer"),

    readChar: function() {
      var str = inputBuffer.domEl.value,
        num;
      if ( str.length === 0 )
        str = prompt( "Input Buffer is empty.\nEnter some more Input:" )[0];
      if ( str === null ) {
        alert( "Char-In Error: No input to work with." );
        return; }

      num = str.charCodeAt(0);
      inputBuffer.domEl.value = str.substring( 1 );
      return num; },

    readInt: function() {
      var str = inputBuffer.domEl.value.trimLeft(),
        num;
      if ( str.length === 0 )
        str = prompt( "Input Buffer is empty.\nEnter some more Input:" );
      if ( ! /\d/.test(str[0]) ) {
        alert( "Int-In Error: Next input is not numeric." );
        return }

      num = str.match(/\d+ ?/)[0];
      inputBuffer.domEl.value = str.substring( num.length );
      return parseInt( num ); }
  };

  window.outputArea = {
    domEl: document.getElementById("output-area"),
    print: function(val) {outputArea.domEl.value += String(val)}
  }

  window.stackArea = document.getElementById("stack-area");
  window.pietStack = [ ];

  window.widthSetting = document.getElementById("setting-canvas_width");
  window.heightSetting = document.getElementById("setting-canvas_height");
  window.codelSizeSetting = document.getElementById("setting-codel_size");

  window.pietColors = [
    "#ffc0c0", "#ff0000", "#c00000",
    "#ffffc0", "#ffff00", "#c0c000",
    "#c0ffc0", "#00ff00", "#00c000",
    "#c0ffff", "#00ffff", "#00c0c0",
    "#c0c0ff", "#0000ff", "#0000c0",
    "#ffc0ff", "#ff00ff", "#c000c0",
    "#000000", "#ffffff"
  ];
  window.selectedColorId = 18;
  window.pietWidth = widthSetting.value;
  window.pietHeight = heightSetting.value;
  window.codelSize = codelSizeSetting.value;

  window.pietImage = new PietImage(pietWidth, pietHeight);
  window.codelPointer = null;
  window.directionPointer = 0; // 0: right, 1: down, 2: left, 3: up
  window.codelChooser = -1; // -1: left, +1: right
  window.initialPointerAndChooser = [directionPointer, codelChooser];

  window.c = document.getElementById("program");
  window.ctx = c.getContext("2d");
  window.gridC = document.getElementById("program-grid");
  window.gridCtx = gridC.getContext("2d");

  document.getElementById("setting-canvas_width").addEventListener("change", function(e) {
    pietWidth = e.target.valueAsNumber;
    resetCanvas();
  });
  document.getElementById("setting-canvas_height").addEventListener("change", function(e) {
    pietHeight = e.target.valueAsNumber;
    resetCanvas();
  });
  document.getElementById("setting-codel_size").addEventListener("change", function(e) {
    codelSize = e.target.valueAsNumber;
    resetCanvas();
  });
  document.getElementById("program-grid").addEventListener("click", function(e) {
    var imgX = e.offsetX/codelSize |0,
        imgY = e.offsetY/codelSize |0;
    pietImage.matrix[imgX][imgY].colorId = selectedColorId;
    paintOnImage( imgX, imgY, pietColors[selectedColorId] );
  });
  document.getElementById("button-run").addEventListener("click", finishExecution);
  document.getElementById("button-step").addEventListener("click", executeStep);
  document.getElementById("button-stop").addEventListener("click", resetExecution);

  resetCanvas();
};
