function InputReader( domEl ) {
  this.domEl = domEl;

  this.readChar = function() {
    var str = this.domEl.value,
      num;
    if ( str.length == 0 )
      str = prompt( "Input Buffer is empty.\nEnter some more Input:" )[0];
    if ( str === null ) {
      alert( "Char-In Error: No input to work with." );
      return;
    }

    num = str.charCodeAt(0);
    this.domEl.value = str.substring( 1 );
    return num;
  }

  this.readInt = function() {
    var str = this.domEl.value.trimLeft();
    var num;
    if ( str.length == 0 )
      str = prompt( "Input Buffer is empty.\nEnter some more Input:" );
    if ( ! /\d/.test(str[0]) ) {
      alert( "Int-In Error: Next input is NaN." );
      return
    }

    num = str.match(/\d+ ?/)[0];
    this.domEl.value = str.substring( num.length );
    return parseInt( num );
  }
}

function OutputWriter( domEl ) {
  this.domEl = domEl;

  this.print = function( value ) {
    this.domEl.value += String( value );
  }
}

function PietStack( domEl ) {
  this.domEl = domEl;

  this.printStack = function( stack ) {
    this.domEl.value = this.map( function(e){
      return e < 32 ? e : `${e}\t${String.fromCharCode(e)}`
    } ).reverse().join("\n");
  }
}

function PietGraphics( colsEl, rowsEl, sizeEl, colors, secondaryColors ) {
  this.colsEl = colsEl;
  this.rowsEl = rowsEl;
  this.sizeEl = sizeEl;
  this.colors = colors;
  this.secondaryColors = secondaryColors;

  this.selectedColorId = 18;

  this.getCols = function() {
    return parseInt( this.colsEl.value);
  }
  this.getRows = function() {
    return parseInt( this.rowsEl.value);
  }
  this.getSize = function() {
    return parseInt( this.sizeEl.value);
  }
}

function Piet( input, output, stack, settings, context2d ) {
  this.inputReader = input;
  this.outputWriter = output;
  this.stack = stack;
  this.ctx = context2d;

  this.settings = settings;

  this.selectColor = function( colorId ) {
    selectedColorId = colorId;
    reloadColorHints();
  }
}

/**
 * Array of 18(-1) functions where the functions' 2d indexes equal
 * [hue diff][darkness diff]
 */
var stackOperations = [
  [ // None, Push, Pop
    function(){},
    function( stack, value ) { stack.push( value ); },
    function( stack ) { stack.pop(); } ],
  [ // Add, Subtract, Multiply
    function( stack ) {
      if (stack.length >= 2)
        stack.push( stack.pop() + stack.pop() ); },
    function( stack ) {
      if (stack.length >= 2)
        stack.push( -stack.pop() + stack.pop() ); },
    function( stack ) {
      if (stack.length >= 2)
        stack.push( stack.pop() * stack.pop() ); } ],
  [ // Divide, Mod, Not
    function( stack ) {
      if (stack.length >= 2) {
        var num1 = stack.pop(),
            num2 = stack.pop();
        if (num1 != 0)
          stack.push( num2/num1 |0 )
        else
          alert( "Can't divide by 0." );
      } },
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

new Piet (
  new InputReader( document.getElementById( "input-buffer" ) ),
  new OutputWriter( document.getElementById( "output-area" ) ),
  new PietStack( document.getElementById( "stack-area" ) ),
  new PietGraphics(
    document.getElementById( "setting-canvas_width" ),
    document.getElementById( "setting-canvas_height" ),
    document.getElementById( "setting-codel_size" ),
    defaultColors, defaultBgColors
  ),
  document.getElementById( "program" ).getContext("2d");
)
