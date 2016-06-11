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

function Codel(x, y, color) {
  this.x = x;
  this.y = y;
  this.color = color;
}

function ColorBlock() {
  this.colors = [];
  this.counts = 0;
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
 * Array of 18(-1) functions where the functions 2d indexes equal
 * [hue change][darkness change]
 */
var stackOperations = [
  [
    function( stack ) { return stack },
    // Push
    function( stack, blockSize ) {
      stack.push( blockSize );
      return stack; },
    // Pop
    function( stack ) {
      stack.pop();
      return stack; }
  ],
  [
    // Add
    function( stack ) {
      if (stack.length >= 2)
        stack.push( stack.pop()+stack.pop() );
      return stack; },
    // Subtract
    function( stack ) {
      if (stack.length >= 2)
        stack.push( -stack.pop()+stack.pop() );
      return stack; },
    // Multiply
    function( stack ) {
      if (stack.length >= 2)
        stack.push( stack.pop()*stack.pop() );
      return stack; }
  ],
  [
    // Divide
    function( stack ) {
      if (stack.length >= 2) {
        var num1 = stack.pop(),
            num2 = stack.pop();
        if (num1 != 0) stack.push( (num2/num1) |0 )
        else alert( "You shall not div/0" );
        return stack; }
      },
    // Mod
    function( stack ) {
      if (stack.length >= 2) {
        var num1 = stack.pop(),
            num2 = stack.pop();
        if (num1 != 0) stack.push( num2%num1 )
        else alert( "You shall not div/0" );
        return stack; }
      },
    // Not
    function( stack ) {
      if (stack.length >= 1)
        stack.push( stack.pop()===0 ? 1 : 0 );
      return stack; }
  ],
  [
    // Greater
    function( stack ) {
      if (stack.length >= 2)
        stack.push( stack.pop() <= stack.pop() ? 1 : 0 );
      return stack; },
    // Pointer
    function( stack ) {
      directionPointer = (directionPointer + stack.pop()) % 4;
      return stack; },
    // Switch
    function( stack ) {
      codelChooser = (codelChooser + stack.pop()) % 2;
      return stack; }
  ],
  [
    // Duplicate
    function( stack ) {
      stack.push( stack[stack.length-1] );
      return stack; },
    // Roll
    function( stack ) {
      if ( stack.length >= 2 ) {
        var num1 = stack.pop(), // Number of rolls
            num2 = stack.pop(); // Depth of roll
        if ( num1 === 0 ) return stack;
        if ( num2 <= 0 ) {
          alert( "Cannot execute roll with negative or no depth." );
          return stack; }

        while ( num2 --> 0 )
          if ( num1 > 0 )
            stack.bury( num1 );
          else // num1 < 0
            stack.digUp( num1 );
        return stack;
      }
    },
    // Int In
    function( stack ) {
      var str = inputBuffer.domElement.value.trimLeft();
      if ( str.length === 0 )
        str = prompt( "Input Buffer is empty.\nEnter some more Input:" );
      if ( ! /\d/.test(str[0]) ) {
        alert( "Int-In Error: Next input is not numeric." );
        return stack; }

      var num = str.match(/\d+ ?/)[0];
      stack.push( parseInt( num ) );
      inputBuffer.domElement.value = str.substring( num.length );
      return stack;
    }
  ],
  [
    // Char In
    function( stack ) {
      var str = inputBuffer.domElement.value;
      if ( str.length === 0 )
        str = prompt( "Input Buffer is empty.\nEnter some more Input:" )[0]
      if ( str === null ) {
        alert( "Char-In Error: No input to work with." );
        return stack; }

      stack.push( str.charCodeAt(0) );
      inputBuffer.domElement.value = str.substring( 1 );
      return stack;
    },
    // Int Out
    function( stack ) {
      if (stack.length > 0)
        outputArea.domElement.value += stack.pop();
      else alert( "Int-Out Error: Stack is so goddamn empty rn." )
      return stack;
    },
    // Char Out
    function( stack ) {
      if (stack.length > 0 && (num = stack.pop()) >= 32)
        outputArea.domElement.value += String.fromCharCode( num );
      return stack;
    }
  ]
]

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
  pietImage.matrix.map((row,x)=>row.map((codel,y)=>{ paintOnImage(x,y,pietColors[codel.color]) }));
}

function resetCanvas() {
  resizeCanvas();
  clearImage();
  clearGrid();
  drawCanvasGrid();
  drawImage();
}

function updateStack() {
  stackArea.innerHTML = pietStack.map((e)=>e).reverse().join("\n");
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

function getColorBlock( coord ) {
  var colorBlock = new ColorBlock();
  colorBlock.codels.push(pietImage.matrix[coord[0]][coord[1]]);

}

function executeNextStep() {
  if (pointer == null) {
    pointer = [0, 0];
    var currentBlock = getColorBlock(pointer);
  }
}

function executeRestOfProgram() {}
function executeStepwise() {}
function stopExecution() {}

function initialize() {
    window.inputBuffer = { domElement: document.getElementById("input-buffer") };
    window.outputArea = { domElement: document.getElementById("output-area") };
    window.widthSetting = document.getElementById("setting-canvas_width");
    window.heightSetting = document.getElementById("setting-canvas_height");
    window.codelSizeSetting = document.getElementById("setting-codel_size");
    window.stackArea = document.getElementById("stack-area");

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
    window.pietStack = [ ];
    window.codelPointer = null;
    window.directionPointer = 0; // right, down, left, up
    window.codelChooser = 0; // left, right

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
      pietImage.matrix[imgX][imgY].color = selectedColorId;
      paintOnImage( imgX, imgY, pietColors[selectedColorId] );
    });
    document.getElementById("button-run").addEventListener("click", executeRestOfProgram);
    document.getElementById("button-step").addEventListener("click", executeStepwise);
    document.getElementById("button-stop").addEventListener("click", stopExecution);

    resetCanvas();
};
