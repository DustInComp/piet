/* Buries the last value in the array to be the n'th last value.
 * Used by the Roll stack operation.
 */
Array.prototype.bury = function( n ) {
  if (n < 0)
    return lift( -n );
  if (n > this.length)
    throw "Can't bury deeper than array length.";
  if (n <= this.length) {
    section = this.splice(this.length - n, n-1);
    while (section.length > 0)
      this.push( section.shift() );
  }
  return this.valueOf();
};

Array.prototype.lift = function( n ) {
  if (n < 0)
    return bury( -n );
  if (n > this.length)
    throw "Can't dig up from deeper than array length";
  this.push( this.splice( this.length - n, 1 )[0] );
  return this.valueOf();
};

function Codel( x, y, colorId ) {
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
 * [hue diff][darkness diff]
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
        if (num1 != 0)
          stack.push( num2/num1 |0 )
        else {
          alert( "Can't divide by 0." );
          return;
        } } },
    function( stack ) {
      if (stack.length >= 2) {
        var num1 = stack.pop(),
            num2 = stack.pop();
        if (num1 != 0)
          stack.push( num2%num1 )
        else {
          alert( "Can't mod 0." );
          return;
        } } },
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
          alert( "Roll depth can't be greater than remaining stack's length" );
          return; }
        if ( num1 === 0 ) return;

        if ( num1 > 0 )
          while ( num1-- > 0 )
            stack.bury( num2 );
        else
          while ( num1++ < 0 )
            stack.lift( num2 ); } },
    function( stack ) { stack.push( inputBuffer.readInt() ); } ],
  [ // Char In, Int Out, Char Out
    function( stack ) { stack.push( inputBuffer.readChar() ); },
    function( stack ) {
      if (stack.length >= 1)
        outputArea.print( stack.pop() );
      else alert( "Int-Out Error: stack is empty." ) },
    function( stack ) {
      if (stack.length >= 1)
        if ((num = stack.pop()) >= 32) {
          outputArea.print( String.fromCharCode( num ));
        }
      else alert( "Int-Out Error: stack is empty." ); } ]
];

function updateStack() {
  stackArea.value = pietStack.map( function(e){
    return e >= 32 ?
      e+"\t"+String.fromCharCode(e)
      : e
  } ).reverse().join("\n");
}

function doStackOperation(hueChange, darknessChange, colorBlockSize) {
  stackOperations[hueChange][darknessChange](pietStack, colorBlockSize);
  updateStack();
}

function drawCanvGrid() {
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

function clearCanvGrid() {
  with (gridCtx) {
    clearRect( 0, 0, canvas.width, canvas.height );
  }
}

function clearCanvImage() {
  with (ctx) {
    fillStyle = "#ffffff";
    fillRect( 0, 0, canvas.width, canvas.height );
  }
}

function drawCanvImage() {
  pietImage.matrix.map((row,x)=>row.map((codel,y)=>{ paintOnImage(x,y,pietColors[codel.colorId]) }));
}

function resetCanvas() {
  resizeCanvas();
  resetCanvImage();
  resetCanvGrid();
}
function resetCanvImage() {
  clearCanvImage();
  drawCanvImage();
}
function resetCanvGrid() {
  clearCanvGrid();
  drawCanvGrid();
}

function paintOnImage( x, y, color ) {
  with ( ctx ) {
    fillStyle = color;
    fillRect( x*codelSize, y*codelSize, codelSize, codelSize );
  }
}

function selectColor( colorId ) {
  selectedColorId = colorId;
  reloadColorHints();
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
        if ( x >= 1 && indexOf( data[x-1][y] ) === -1 )
          push( data[x-1][y] );
        if ( y >= 1 && indexOf( data[x][y-1] ) === -1 )
          push( data[x][y-1] );
        if ( x < data.length-1 && indexOf( data[x+1][y] ) === -1 )
          push( data[x+1][y] );
        if ( y < data[0].length-1 && indexOf( data[x][y+1] ) === -1 )
          push( data[x][y+1] ); }
    }
  };

  var i = 0;
  while (i < codelsChecked.length) checkCodel( codelsChecked[i++] );

  return colorBlock;
}

function determineNextCodel( codeBlock ) {
  var dP = directionPointer;
  var cC = codelChooser;
  var sP = (dP + cC) < 0 ?
      dP + cC + 4 :
      (dP + cC) % 4;
  var edgeCodel;
  var targetCodel;
  var passedWhite = false;

  targetCodel = edgeCodel = codeBlock.codels.reduce( (prev, curr) =>
    // curr is further to the edge than prev if
    // it is further along the direction of the directionPointer or
    // it is as far along that direction and further along the codelChooser
    //   direction than prev

    (dP === 0) && ( // directionPointer points right
      curr.x > prev.x || // curr is right of prev
      curr.x === prev.x && ( // curr is parallel to prev
        sP === 1 && curr.y > prev.y || // sP points down and curr is below prev
        sP === 3 && curr.y < prev.y // sP points up and curr is above prev
      )
    ) ||
    (dP === 1) && (
      curr.y > prev.y ||
      curr.y === prev.y && (
        sP === 2 && curr.x < prev.x ||
        sP === 0 && curr.x > prev.x
      )
    ) ||
    (dP === 2) && (
      curr.x < prev.x ||
      curr.x === prev.x && (
        sP === 3 && curr.y < prev.y ||
        sP === 1 && curr.y > prev.y
      )
    ) ||
    (dP === 3) && (
      curr.y < prev.y ||
      curr.y === prev.y && (
        sP === 0 && curr.x > prev.x ||
        sP === 2 && curr.x < prev.x
      )
    ) ? curr : prev
  );

  for (var i = (dP%2 == 1 ? edgeCodel.y : edgeCodel.x ) + ( dP<2 ? 1 : -1 );
      dP>1 ? i>=0 : i < (dP < 1 ? pietWidth : pietHeight);
      dP<2 ? i++ : i-- )
    with( dP % 2 ? pietImage.matrix[edgeCodel.x][i] : pietImage.matrix[i][edgeCodel.y] ) {
      if (colorId < 18) {
        targetCodel = dP % 2 ? pietImage.matrix[edgeCodel.x][i] : pietImage.matrix[i][edgeCodel.y];
        break;
      }
      if (colorId === 19)
        passedWhite = true;
      if (colorId === 18)
        break;
    }

    // make path visible
    advancePath(edgeCodel, targetCodel, dP, sP);
/*
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
*/

  return [targetCodel, passedWhite];
}

function advancePath(edgeCodel, targetCodel, dP, sP) {
  gridCtx.lineTo(
    (edgeCodel.x+.5 + (!(dP%2)&&(.8*(dP==0) -.4)) + (!(sP%2)&&(.4*(sP==0) -.2)) +.1*(Math.random()-.5) )*codelSize,
    (edgeCodel.y+.5 + (dP%2&&(.8*(dP==1) -.4)) + (sP%2&&(.4*(sP==1) -.2)) +.1*(Math.random()-.5) )*codelSize
  );
  if (targetCodel !== edgeCodel)
    gridCtx.lineTo(
      (targetCodel.x+.5 + (!(dP%2)&&(.8*(dP==0) -.4)) + (!(sP%2)&&(.4*(sP==0) -.2)) +.1*(Math.random()-.5) )*codelSize,
      (targetCodel.y+.5 + (dP%2&&(.8*(dP==1) -.4)) + (sP%2&&(.4*(sP==1) -.2)) +.1*(Math.random()-.5) )*codelSize
    );
  resetCanvGrid();
  gridCtx.stroke();
}

function executeStep() {
  if (codelPointer == null) {
    codelPointer = [0, 0];

    resetCanvas();
    gridCtx.moveTo( .5*codelSize, .5*codelSize );

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
    if (directionPointer%2 ^ codelChooser==1)
      directionPointer = (directionPointer+1) % 4
    else codelChooser *= -1;

    console.log( "Direction changed: " +
      ["right","down","left","up"][directionPointer] + ", then " +
      (codelChooser === -1 ? "left" : "right"));

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
  initialPointerAndChooser = [directionPointer, codelChooser];
  pietStack = [];
  updateStack();
}

function reloadColorHints() {
  function getEls(s) {
    return document.getElementsByClassName( s );
  }
  function setHint(elArr, colorId) {
    for (var i = 0; i < elArr.length; i++) {
      elArr[i].style.backgroundColor = pietBgColors[colorId];
      elArr[i].style.borderBottom = "1px solid " + pietColors[colorId];
      // elArr[i].parent.style.backgroundColor = pietColors[colorId];
    }
  }

  var elementArrayList = [
    "non", "psh", "pop",
    "add", "sub", "mpl",
    "div", "mod", "not",
    "grt", "ptr", "swt",
    "dup", "rol", "nbi",
    "chi", "nbo", "cho" ].map( function(cmd) { return getEls("cmd-"+cmd); } );

  for ( var i = 0; i < elementArrayList.length; i++ ) {
    if (selectedColorId < 18) {
      let _colorId = ((selectedColorId/3|0)+(i/3|0))%6*3 + (selectedColorId+i)%3
      setHint( elementArrayList[i], _colorId );

      for (var j = 0; j < elementArrayList[i].length; j++) {
        elementArrayList[i][j].onclick = function(){selectColor( _colorId );};
      }
    } else {
      setHint( elementArrayList[i], i==0 ? selectedColorId : i );

      for (j = 0; j < elementArrayList[i].length; j++) {
        let _i = i;
        elementArrayList[i][j].onclick = function(){selectColor( _i );};
      }
    }
  }
}

function resizePietImage( newWidth, newHeight ) {
  if ( newWidth < 1 || newHeight < 1 )
    return console.error( "Oh hell no." );

  var oldWidth = pietImage.matrix.length,
    oldHeight = pietImage.matrix[0].length;

  pietImage.width = newWidth;
  pietImage.height = newHeight;

  if ( newWidth > oldWidth ) {
    pietWidth = newWidth;
    let i = oldWidth;
    while ( i < newWidth ) {
      pietImage.matrix.push([]);

      let j = 0;
      while ( j < oldHeight) {
        pietImage.matrix[i].push( new Codel( i, j, 19 ) );
        j++;
      }
      i++;
    }
  }

  if ( newWidth < oldWidth )
    pietWidth = newWidth;

  if ( newHeight > oldHeight ) {
    pietHeight = newHeight;
    let i = 0;
    while ( i < newWidth ) {
      let j = oldHeight;
      while ( j < newHeight ) {
        pietImage.matrix[i].push( new Codel( i, j, 19 ) );
        j++;
      }
      i++;
    }
  }

  if ( newHeight < oldHeight )
    pietHeight = newHeight;
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
      return num;
    },

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
      return parseInt( num );
    }
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
  window.pietBgColors = [
    "#fff0f0", "#ffd0d0", "#ffb0b0",
    "#fffff0", "#ffffd0", "#ffffb0",
    "#f0fff0", "#d0ffd0", "#b0ffb0",
    "#f0ffff", "#d0ffff", "#b0ffff",
    "#f0f0ff", "#d0d0ff", "#b0b0ff",
    "#fff0ff", "#ffd0ff", "#ffb0ff",
    "#b0b0b0", "#ffffff"
  ]
  window.selectedColorId;
  selectColor( 18 );
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
    resizePietImage( e.target.valueAsNumber, pietHeight );
    resetCanvas();
  });
  document.getElementById("setting-canvas_height").addEventListener("change", function(e) {
    resizePietImage( pietWidth, e.target.valueAsNumber );
    resetCanvas();
  });
  document.getElementById("setting-codel_size").addEventListener("change", function(e) {
    codelSize = e.target.valueAsNumber;
    resetCanvas();
  });
  document.getElementById("program-grid").addEventListener("click", function(e) {
    console.log(e);
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
