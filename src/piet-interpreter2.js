/**
 * Burries the last value in the array to be the nth last value.
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

/**
 * Moves the nth last value of the array to the last index.
 * Used by the Roll stack op.
 */
Array.prototype.digUp = function ( n ) {
  if (n < 0) return bury( -n );
  this.push( this.splice( this.length - n, 1 )[0] );
  return this.valueOf();
};

/**
 * A single Code Pixel. Will be instantiated when creating or resizing the PietImage
 */
function Codel(x, y, colorId) {
  this.x = x;
  this.y = y;
  this.colorId = colorId;
}

function ColorBlock( color ) {
  this.color = color;
  this.codels = [];
  this.count = 0;
}

function PietImage(width, height) {
  this.matrix = (function(){
    var arr = [];
    for (var x = 0; x < width; x++) {
      arr.push( [] );
      for (var y = 0; y < height; y++)
        arr[x].push( new Codel(x, y, 19) );
    }
    return arr;
  })();

  this.findColorBlock = function( _x, _y ) {
    var data = this.matrix,
      colorBlock = new ColorBlock( data[_x][_y].colorId ),
      codelsChecked = [ data[_x][_y] ],
      checkCodel = function( codel ) {
        if (codel.colorId == colorBlock.color) {
          colorBlock.codels.push( codel );

          with(codelsChecked) with(codel) {
            if ( x>=1 && indexOf(data[x-1][y]) === -1 )
              push( data[x-1][y] );
            if ( y>=1 && indexOf(data[x][y-1]) === -1 )
              push( data[x][y-1] );
            if ( x<data.length-1 && indexOf(data[x+1][y]) === -1 )
              push( data[x+1][y] );
            if ( y<data[0].length-1 && indexOf(data[x][y+1]) === -1 )
              push( data[x][y+1] );
          }
        }
      };

    var i = 0;
    while (i++ < codelsChecked.length) checkCodel( codelsChecked[i] );

    return colorBlock;
  };

  this.resize = function() {

  };
}

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
        codelChooser = (codelChooser + stack.pop()) % 2; } ],
  [ // Duplicate, Roll, Int In
    function( stack ) {
      if (stack.length >= 1)
        stack.push( stack[stack.length-1] ); },
    function( stack ) {
      if ( stack.length >= 2 ) {
        var num1 = stack.pop(), // Number of rolls
            num2 = stack.pop(); // Depth of roll
        if ( num1 === 0 ) return;
        if ( num2 <= 0 ) alert( "Roll depth has to be at least 1" );

        while ( num2 --> 0 )
          if ( num1 > 0 ) stack.bury( num1 )
          else stack.digUp( num1 ); } },
    function( stack ) {
      pietInput.readInt(); } ],
  [ // Char In, Int Out, Char Out
    function( stack ) {
      pietInput.readChar(); },
    function( stack ) {
      if (stack.length >= 1)
        outputArea.domElement.value += stack.pop();
      else alert( "Int-Out Error: Stack is so goddamn empty rn." ) },
    function( stack ) {
      if (stack.length >= 1 && (num = stack.pop()) >= 32)
        outputArea.domElement.value += String.fromCharCode( num ); } ]
];

function initialize() {
  window.pietSettings = {
    codelsHigh: 16,
    codelsWide: 16,
    codelSize: 20,
  };

  window.pietInput = {
    domEl: document.getElementById("input-area"),

    readChar: function() {
      var str = pietInput.domEl.value;
      if ( str.length === 0 )
        str = prompt( "Input Buffer is empty.\nEnter some more Input:" )[0];
      if ( str === null ) {
        alert( "Char-In Error: No input to work with." );
        return; }

      stack.push( str.charCodeAt(0) );
      pietInput.domEl.value = str.substring( 1 );
    },
    readInt: function() {
      var str = pietInput.domEl.value.trimLeft();
      if ( str.length === 0 )
        str = prompt( "Input Buffer is empty.\nEnter some more Input:" );
      if ( ! /\d/.test(str[0]) ) {
        alert( "Int-In Error: Next input is not numeric." );
        return }

      var num = str.match(/\d+ ?/)[0];
      stack.push( parseInt( num ) );
      pietInput.domEl.value = str.substring( num.length );
    }
  }

  window.pietOutput = {
    domEl: document.getElementById("output-area"),

    write: function( output ) { pietOutput.domEl.value += output }
  }

  window.colorPicker = {
    colors: [
      "#ffc0c0", "#ff0000", "#c00000",
      "#ffffc0", "#ffff00", "#c0c000",
      "#c0ffc0", "#00ff00", "#00c000",
      "#c0ffff", "#00ffff", "#00c0c0",
      "#c0c0ff", "#0000ff", "#0000c0",
      "#ffc0ff", "#ff00ff", "#c000c0",
      "#000000", "#ffffff"
    ],
    selectedColor: 18,

    select: function(id) { return colorPicker.selectedColor = id; }
  }

  window.pietStack = {
    domEl: document.getElementById("stack-area"),
    stack: [],
    operations: stackOperations,

    updateDom: function() {
      pietStack.domEl.value = pietStack.stack.map((e)=>e).reverse().join("\n");
    },
    doOperation: function( huechange, darkChange, blockSize ) {
      pietStack.operations[hueChange][darkChange](pietStack.stack, blockSize);
      return pietStack.stack;
    }
  }

  window.pietCanvas = {
    domEl: document.getElementById("program"),
    ctx: document.getElementById("program").getContext("2d"),

    paintCodel: function( x, y, color ) {
      var codelSize = pietSettings.codelSize;
      with ( pietCanvas.ctx ) {
        fillStyle = color;
        fillRect( x*codelSize, y*codelSize, codelSize, codelSize );
      }
    },

    paintImage: function( pietImage ) {
      pietImage.matrix.map( function(row, x) {
        return row.map( function(codel, y) {
          paintOnImage(x, y, colorPicker.colors[codel.colorId]);
        });
      });
    }
  }

  window.pietInterpreter = {
    pietImage: new PietImage( pietSettings.codelsWide, pietSettings.codelsHigh ),
    pointerPos: [0, 0],
    directionVector: 0,
    codelChooser: 0,

    determineNextCodel: function(x, y) {

    },
    initialStep: function() {

    },
    nextStep: function() {
      return false;
    },
    finish: function() {
      while ( nextStep() );
    },
    reset: function() {

    }
  }

  window.pietCanvasGrid = {
    domEl: document.getElementById("program-grid"),
    ctx: document.getElementById("program-grid").getContext("2d")
  }

  document.getElementById("setting-canvas_width").addEventListener("change", function(e) {
    pietSettings.codelsWide = pietInterpreter.pietImage.width =  e.target.valueAsNumber;
    resetCanvas();
  });
  document.getElementById("setting-canvas_height").addEventListener("change", function(e) {
    pietSettings.codelsHigh = pietInterpreter.pietImage.height =  e.target.valueAsNumber;
    resetCanvas();
  });
  document.getElementById("setting-codel_size").addEventListener("change", function(e) {
    pietSettings.codelSize = e.target.valueAsNumber;
    resetCanvas();
  });
  document.getElementById("program-grid").addEventListener("click", function(e) {
    var imgX = e.offsetX/pietSettings.codelSize |0,
        imgY = e.offsetY/pietSettings.codelSize |0;
    pietInterpreter.pietImage.matrix[imgX][imgY].colorId = colorPicker.selectedColor;
    pietCanvas.paintCodel( imgX, imgY, colorPicker.colors[colorPicker.selectedColor] );
  });
  document.getElementById("button-run").addEventListener("click", pietInterpreter.finish);
  document.getElementById("button-step").addEventListener("click", pietInterpreter.nextStep);
  document.getElementById("button-stop").addEventListener("click", pietInterpreter.reset);

}
