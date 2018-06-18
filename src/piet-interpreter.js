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
        function( stack ) { stack.pop(); }
    ],  [ // Add, Subtract, Multiply
    function( stack ) {
        if (stack.length >= 2)
            stack.push( stack.pop()+stack.pop() ); },
    function( stack ) {
        if (stack.length >= 2)
            stack.push( -stack.pop()+stack.pop() ); },
    function( stack ) {
        if (stack.length >= 2)
            stack.push( stack.pop()*stack.pop() ); }
    ], [ // Divide, Mod, Not
    function( stack ) {
        if (stack.length >= 2) {
            var num1 = stack.pop(),
                num2 = stack.pop();
        if (num1 != 0)
            stack.push( num2/num1 |0 )
        else {
            console.error( "Can't divide by 0." );
            return;
        } } },
    function( stack ) {
        if (stack.length >= 2) {
            var num1 = stack.pop(),
                num2 = stack.pop();
        if (num1 != 0)
            stack.push( num2%num1 + (num2<0&&num1) )
        else {
            console.error( "Can't mod 0." );
            return;
        } } },
    function( stack ) {
        if (stack.length >= 1)
            stack.push( stack.pop()===0 ? 1 : 0 ); }
    ], [ // Greater, Pointer, Switch
    function( stack ) {
        if (stack.length >= 2)
            stack.push( stack.pop() <= stack.pop() ? 1 : 0 ); },
    function( stack ) {
        if (stack.length >= 1)
            directionPointer = (directionPointer + stack.pop()) % 4; },
    function( stack ) {
        if (stack.length >= 1)
            if ( stack.pop() % 2 === 1 )
                codelChooser *= -1; }
    ], [ // Duplicate, Roll, Int In
    function( stack ) {
        if (stack.length >= 1)
            stack.push( stack[stack.length-1] ); },
    function( stack ) {
        if ( stack.length > 2 ) {
            var num1 = stack.pop(), // Number of rolls
                num2 = stack.pop(); // Depth of roll
        if ( num2 <= 0 ) {
            console.error( "Roll depth must be at least 1" );
            return; }
        if ( num2 > stack.length ) {
            console.error( "Roll depth can't be greater than remaining stack's length" );
            return; }
        if ( num1 === 0 )
            return;
        if ( num1 > 0 )
            while ( num1-- > 0 )
                stack.bury( num2 );
        else
            while ( num1++ < 0 )
                stack.lift( num2 ); } },
    function( stack ) { stack.push( inputBuffer.readInt() ); }
    ], [ // Char In, Int Out, Char Out
    function( stack ) { stack.push( inputBuffer.readChar() ); },
    function( stack ) {
        if (stack.length >= 1)
            outputArea.print( stack.pop() );
        else console.error( "Int-Out Error: stack is empty." ) },
    function( stack ) {
        if (stack.length >= 1) {
            if ((num = stack.pop()) >= 32)
                outputArea.print( String.fromCharCode( num ));
            else console.warn( "Char-Out Error: value could not be printed." )
        } else console.error( "Char-Out Error: stack is empty." ); } ]
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

// ---- Canvas stuff -----------------------------------------------------------

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

function repaintCanvas() {
    resizeCanvas();
    repaintCanvImage();
    repaintCanvGrid();
}
function repaintCanvImage() {
    clearCanvImage();
    drawCanvImage();
    gridCtx.moveTo( .5*codelSize, .5*codelSize );
}
function repaintCanvGrid() {
    clearCanvGrid();
    drawCanvGrid();
}

function paintOnImage( x, y, color ) {
  with ( ctx ) {
    fillStyle = color;
    fillRect( x*codelSize, y*codelSize, codelSize, codelSize );
  }
}

// ---- Logic ------------------------------------------------------------------

function selectColor( colorId ) {
  selectedColorId = colorId;
  reloadColorHints();
}

/**
 * Collect all codels connected to the one at given coordinates
 */
function findColorBlock( _x, _y ) {
    var matrix = pietImage.matrix; // reference to codel matrix
    var block = new ColorBlock( matrix[_x][_y].colorId );
    var candidates = [ matrix[_x][_y] ];

    var checkCodel = function( codel ) {
        if (codel.colorId == block.colorId) {
            block.codels.push( codel );
            ({x,y} = codel);

            if ( x > 0 && !candidates.includes(matrix[x-1][y]) )
                candidates.push( matrix[x-1][y] );
            if ( y > 0 && !candidates.includes(matrix[x][y-1]) )
                candidates.push( matrix[x][y-1] );
            if ( x < pietWidth-1 && !candidates.includes(matrix[x+1][y]) )
                candidates.push( matrix[x+1][y] );
            if ( y < pietHeight-1 && !candidates.includes(matrix[x][y+1]) )
                candidates.push( matrix[x][y+1] );
        }
    };

    var i = 0;
    while (i < candidates.length) {
        checkCodel( candidates[i++] );
    }

    block.count = block.codels.length;
    return block;
}

/**
 * Figure out the next codel to move to
 */
function determineNextCodel( currBlock ) {
    var matrix = pietImage.matrix;
    var dp = directionPointer;
    var cc = codelChooser;
    var edgeCodel = matrix[codelPointer[0]][codelPointer[1]];
    var tx, ty;

    if ( currBlock.colorId < 18 ) {
        edgeCodel = currBlock.codels.reduce( (prev, curr) =>
            // curr is further to the edge than prev if
            // it is further along the direction of the directionPointer or
            // it is as far along that direction and further along the codelChooser
            //   direction than prev
            dp == 0 && (
                curr.x > prev.x ||
                curr.x == prev.x &&
                    (cc ? curr.y > prev.y
                        : curr.y < prev.y) ) ||
            dp == 1 && (
                curr.y > prev.y ||
                curr.y == prev.y &&
                    (cc ? curr.x < prev.x
                        : curr.x > prev.x) ) ||
            dp == 2 && (
                curr.x < prev.x ||
                curr.x == prev.x &&
                    (cc ? curr.y < prev.y
                        : curr.y > prev.y) ) ||
            dp == 3 && (
                curr.y < prev.y ||
                curr.y == prev.y &&
                    (cc ? curr.x > prev.x
                        : curr.x < prev.x) )
            ? curr : prev
        );
    }
    console.log(edgeCodel);
    [tx, ty] = [
        edgeCodel.x + (dp&1?0:(dp<2?1:-1)),
        edgeCodel.y + (dp&1?(dp<2?1:-1):0)
    ];
    console.log(tx,ty);
    var nextCodel = ( tx>=0 && tx<pietWidth
        && ty>=0 && ty<pietHeight
        && matrix[tx][ty].colorId != 18 )
            ? matrix[tx][ty]
            : edgeCodel;

    return nextCodel;
}

function advancePath(codel, dp, cc) {
    var length = pietPath.push([...arguments]);

    if (
        length>=2
            && codel.colorId != pietPath[length-2][0].colorId
            && pietPath[length-2][0].colorId != 19
        || length >= 3
            && codel != pietPath[length-2][0]
            && pietPath[length-2][0] == pietPath[length-3][0]
            && pietPath[length-2][0].colorId == 19) {
        var px = codel.x + (dp&1?0:(dp<2?-1:1));
        var py = codel.y + (dp&1?(dp<2?-1:1):0);
        gridCtx.lineTo(
            codelSize*(px+(dp&1?.5+((dp>>1&1)^cc?-1:1)*.2:.9-.8*(dp>>1&1))+.1*(Math.random()-.5)),
            codelSize*(py+(dp&1?.9-.8*(dp>>1&1):.5+((dp>>1&1)^cc?1:-1)*.2)+.1*(Math.random()-.5))
        );
    };
    gridCtx.lineTo(
        codelSize*(codel.x+(dp&1?.5+((dp>>1&1)^cc?-1:1)*.2:.9-.8*(dp>>1&1))+.1*(Math.random()-.5)),
        codelSize*(codel.y+(dp&1?.9-.8*(dp>>1&1):.5+((dp>>1&1)^cc?1:-1)*.2)+.1*(Math.random()-.5))
    );

    repaintCanvGrid();
    gridCtx.stroke();
}

function executeStep() {
    if (codelPointer == null) {
        initExecution();
        codelPointer = [0, 0];

        advancePath(pietImage.matrix[0][0], 0, 0);
        return;
    }

    var prevBlock = findColorBlock( ...codelPointer );
    var currCodel = determineNextCodel( prevBlock );
    console.log( "from", prevBlock, prevBlock.colorId/3 |0, prevBlock.colorId % 3 );

    advancePath(currCodel, directionPointer, codelChooser);
    if ( !prevBlock.codels.includes( currCodel ) ) {

        if ( prevBlock.colorId < 18 && currCodel.colorId < 18 ) {
            var prevHue = prevBlock.colorId/3 |0;
            var prevDrk = prevBlock.colorId % 3;
            var currHue = currCodel.colorId/3 |0;
            var currDrk = currCodel.colorId % 3;

            doStackOperation(
                (currHue-prevHue+6)%6,
                (currDrk-prevDrk+3)%3,
                prevBlock.count
            );
        }
        console.log( "to", findColorBlock( currCodel.x, currCodel.y ), currHue, currDrk );
    } else {
        var prevCodel = pietImage.matrix[codelPointer[0]][codelPointer[1]];

        // If pointer is sliding across white codels, don't change direction
        if (! (prevBlock.colorId==19 && currCodel!=prevCodel)) {
            codelChooser = codelChooser+1 & 1;
            // If pointer is blocked while on white codel, always change DP
            if ( codelChooser==0 || prevBlock.colorId==19 ) {
                directionPointer = directionPointer+1 & 3;
            }
            console.log( "Direction changed: " +
                ["right","down","left","up"][directionPointer] + ", then " +
                (!codelChooser ? "left" : "right")
            );
        }
    }

    // Pointer in a loop (Next codel can't be found)
    if ( isLooping(currCodel, directionPointer, codelChooser) ) {
        alert("Program finished.");
        stopExecution();
        return;
    }

    codelPointer = [currCodel.x, currCodel.y];
}

function isLooping( codel, dp, cc ) {
    for (i = 0; i < pietPath.length-1; i++ ) {
        var entry = pietPath[pietPath.length-2-i];

        if (entry[0].colorId != codel.colorId)
            break;
        if (entry[0]==codel && entry[1]==dp && entry[2]==cc)
            return true;
    }
    return false;
}

function finishExecution() {
    do {
        executeStep();
    } while (codelPointer !== null);
}

function stopExecution() {
    window.codelPointer = null;
}
function initExecution() {
    window.codelPointer = null;
    window.directionPointer = 0;
    window.codelChooser = 0;

    window.pietStack = [];
    window.pietPath = [];
    window.outputArea.domEl.value = "";
    updateStack();
    repaintCanvas();
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
                str = prompt( "Input Buffer is empty.\nEnter some character:" )[0];
            if ( str === null ) {
                console.error( "Char-In Error: No input to work with." );
                return;
            }
            num = str.charCodeAt(0);
            inputBuffer.domEl.value = str.substring( 1 );
            return num;
        },

        readInt: function() {
            var str = inputBuffer.domEl.value.trimLeft(),
                num;
            if ( str.length === 0 )
                str = prompt( "Input Buffer is empty.\nEnter some number:" );
            if ( ! /\d/.test(str[0]) ) {
                console.error( "Int-In Error: Next input is not numeric." );
                return;
            }

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
  window.pietStack = [];
  window.pietPath = [];

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

  window.c = document.getElementById("program");
  window.ctx = c.getContext("2d");
  window.gridC = document.getElementById("program-grid");
  window.gridCtx = gridC.getContext("2d");

  window.pietImage = new PietImage(pietWidth, pietHeight);
  initExecution();

  document.getElementById("setting-canvas_width").addEventListener("change", function(e) {
    resizePietImage( e.target.valueAsNumber, pietHeight );
    repaintCanvas();
  });
  document.getElementById("setting-canvas_height").addEventListener("change", function(e) {
    resizePietImage( pietWidth, e.target.valueAsNumber );
    repaintCanvas();
  });
  document.getElementById("setting-codel_size").addEventListener("change", function(e) {
    codelSize = e.target.valueAsNumber;
    repaintCanvas();
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
  document.getElementById("button-stop").addEventListener("click", stopExecution);

  repaintCanvas();
};
