var test = "A1+B2 *(C3- D4)";
console.log(test);
var regexp = /\s*([+*\-\(\)])\s*/;
console.log(test.split(regexp));