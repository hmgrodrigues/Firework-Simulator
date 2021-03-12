//Variáveis globais

var gl;
var canvas;

var lines;
var points = [];

var program1;
var program2;

var linesBufferId;
var pointsBufferId;

var linePositionLoc;
var p0Loc;
var p1Loc;
var t0Loc;
var v0Explosion1Loc;
var v0Explosion2Loc;
var vColorLoc;
var globalTimeLoc;
var pointsNumberLoc;
var riseAnimationVLoc;
var stayBackTimeLoc;

var isDrawing = false;
var startPos;
var endPos;

var automaticFireworks = false;

var indexToWrite = 0;
var counter = 0;
var globalTime = 0;

/*Quando a página é carregada definimos os programas a serem executados,
bem como a criação de 2 buffers (linhas e pontos)*/

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }    
    
    // Configure WebGL
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mouseup", mouseUp);
    canvas.addEventListener("mousemove", mouseMove);
    window.addEventListener("keypress", keyPress);
    
    program1 = initShaders(gl, "vertex-shader-lines", "fragment-shader-lines");
    program2 = initShaders(gl, "vertex-shader-points", "fragment-shader-points");
    
    linesBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, linesBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, 32, gl.STATIC_DRAW);
    
    linePositionLoc = gl.getAttribLocation(program1, "linePosition");
    gl.enableVertexAttribArray(linePositionLoc);

    pointsBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, 144*65000, gl.STATIC_DRAW);
    
    p0Loc = gl.getAttribLocation(program2, "p0");
    gl.enableVertexAttribArray(p0Loc);
    p1Loc = gl.getAttribLocation(program2, "p1");
    gl.enableVertexAttribArray(p1Loc);
    t0Loc = gl.getAttribLocation(program2, "t0");
    gl.enableVertexAttribArray(t0Loc);
    v0Explosion1Loc = gl.getAttribLocation(program2, "v0Explosion1");
    gl.enableVertexAttribArray(v0Explosion1Loc);
    v0Explosion2Loc = gl.getAttribLocation(program2, "v0Explosion2");
    gl.enableVertexAttribArray(v0Explosion2Loc);
    vColorLoc = gl.getAttribLocation(program2, "vColor");
    gl.enableVertexAttribArray(vColorLoc);
    pointsNumberLoc = gl.getAttribLocation(program2, "pointsNumber");
    gl.enableVertexAttribArray(pointsNumberLoc);
    riseAnimationVLoc = gl.getAttribLocation(program2, "riseAnimationV");
    gl.enableVertexAttribArray(riseAnimationVLoc);
    stayBackTimeLoc = gl.getAttribLocation(program2, "stayBackTime");
    gl.enableVertexAttribArray(stayBackTimeLoc);

    render();
}

//Função que está constantemente a correr
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    if(isDrawing)
        drawLine();
    if(automaticFireworks && (Math.round(globalTime * 100) % 40 == 0))
        randomAutomaticPoints();
    drawPoints();
    updateGlobalTime();
    window.requestAnimFrame(render);
}

//Verificamos quando se carrega no botão do lado esquerdo do rato
function mouseDown(ev){
    if(ev.button == 0){
        isDrawing = true;
        lines = [];
        startPos = endPos = getMousePos(canvas, ev);
        lines.push(startPos);
        linesHandelers();
    }
}

//Verificamos quando o botão do lado esquerdo do rato é largado
function mouseUp(ev){
    if(ev.button == 0){
        isDrawing = false;
        linesHandelers();
        createPoints(startPos, endPos);
    }
}

//Verificamos quando o botão do lado esquerdo do rato está a ser pressionado ao mesmo tempo que o rato se move
function mouseMove(ev){
    if(ev.button == 0)
        if(isDrawing){
            endPos = getMousePos(canvas, ev);
            linesHandelers();
        }
}

//Verificamos se a tecla "espaço" foi pressionada para ativar/desativar o lançamento automático 
function keyPress(ev){
    if(ev.keyCode == 32){
        if(automaticFireworks)
            automaticFireworks = false;
        else 
            automaticFireworks = true;
    }
}

//Atualiza a posição final da linha, tanto no array como no buffer
function linesHandelers(){
    lines[1] = endPos; 
    gl.bindBuffer(gl.ARRAY_BUFFER, linesBufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(lines));
}

//As caracteristicas de um ponto são guardadas no buffer
function pointsHandelers(){
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
}

//Faz a transição das medidas/dimensões da janela para as do canvas
function getMousePos(canvas, ev){
    var x = -1 + (ev.offsetX / canvas.width) * 2;
    var y = 1 - (ev.offsetY / canvas.height) * 2;
    return vec4(x, y, 0.0, 1.0);
}

//Cria pontos random, apesar de que com um certo padrão, a serem usados no lançamento automático
function randomAutomaticPoints(){
    var x = Math.random() * (0.9 + 0.9) - 0.9;
    randomStartPos = vec4(x, -1.0, 0.0, 1.0);
    var y = Math.random() * (0.0 + 0.5) - 0.5;
    randomFinalPos = vec4(x + (Math.random() * (0.05 + 0.05) - 0.05), y, 0.0, 1.0);
    createPoints(randomStartPos, randomFinalPos);
}

//São criados pontos. Os argumentos da função serão usados no cálculo da sua velocidade inicial
function createPoints(startPos, endPos){
    var randomPointsNumber = Math.floor(Math.random() * 250) + 10;
    if(counter + randomPointsNumber < 65000)
        counter += randomPointsNumber;
    else
        counter = 65000;
    var stayBackPointTime = 0;
    var randomColorComponent1 = Math.random();
    var randomColorComponent2 = Math.random();
    var randomColorComponent3 = Math.random();
    var secondExplosion = 0;
    var riseAnimationTime = 0;
    var v0xExplosion1, v0xExplosion2, v0yExplosion1, v0yExplosion2;
    for(var i = 0; i < randomPointsNumber; i++){
        if(randomPointsNumber >= 200){
            if(secondExplosion == 0){
                var thetaExplosion1 = Math.random() * 2 * Math.PI;
                v0xExplosion1 = Math.cos(thetaExplosion1) * 0.3 * Math.random();
                v0yExplosion1 = Math.sin(thetaExplosion1) * 0.3 * Math.random();
                secondExplosion = 5;
            }
            secondExplosion--;
        }
        else{
            var thetaExplosion1 = Math.random() * 2 * Math.PI;
            v0xExplosion1 = Math.cos(thetaExplosion1) * 0.3 * Math.random();
            v0yExplosion1 = Math.sin(thetaExplosion1) * 0.3 * Math.random();
        }
        var thetaExplosion2 = Math.random() * 2 * Math.PI;
        v0xExplosion2 = Math.cos(thetaExplosion2) * 0.3 * Math.random();
        v0yExplosion2 = Math.sin(thetaExplosion2) * 0.3 * Math.random();
        if(indexToWrite == 65000 * 9)
            indexToWrite = 0;
        points[indexToWrite++] = startPos;
        points[indexToWrite++] = endPos;
        points[indexToWrite++] = vec4(globalTime, globalTime, globalTime, globalTime);
        points[indexToWrite++] = vec4(v0xExplosion1, v0yExplosion1, 0.0, 0.0);
        points[indexToWrite++] = vec4(v0xExplosion2, v0yExplosion2, 0.0, 0.0);
        points[indexToWrite++] = vec4(randomColorComponent1, randomColorComponent2, randomColorComponent3, 1.0);
        points[indexToWrite++] = vec4(randomPointsNumber, randomPointsNumber, randomPointsNumber, randomPointsNumber);
        var thetaRiseAnimation = Math.random() * (1.75 * Math.PI - 1.25 * Math.PI) + 1.25 * Math.PI;
        var v0xRiseAnimation = Math.cos(thetaRiseAnimation) * 0.3 * Math.random();
        var v0yRiseAnimation = Math.sin(thetaRiseAnimation) * 0.3 * Math.random();
        points[indexToWrite++] = vec4(v0xRiseAnimation, v0yRiseAnimation, 0.0, 0.0);
        points[indexToWrite++] = vec4(stayBackPointTime, stayBackPointTime, stayBackPointTime, stayBackPointTime);
        stayBackPointTime += (1/60)*2;
        }   
    pointsHandelers();
}

//Faz desenhar a linha e o ponto inicial da trajetória
function drawLine(){
    gl.useProgram(program1);
    gl.bindBuffer(gl.ARRAY_BUFFER, linesBufferId);
    gl.vertexAttribPointer(linePositionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, 2);
    gl.drawArrays(gl.POINTS, 0, 1);
}

//Faz desenhar os pontos nas diversas animações
function drawPoints(){
    gl.useProgram(program2);
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferId);
    gl.vertexAttribPointer(p0Loc, 4, gl.FLOAT, false, 144, 0);
    gl.vertexAttribPointer(p1Loc, 4, gl.FLOAT, false, 144, 16);
    gl.vertexAttribPointer(t0Loc, 4, gl.FLOAT, false, 144, 32);
    gl.vertexAttribPointer(v0Explosion1Loc, 4, gl.FLOAT, false, 144, 48);
    gl.vertexAttribPointer(v0Explosion2Loc, 4, gl.FLOAT, false, 144, 64);
    gl.vertexAttribPointer(vColorLoc, 4, gl.FLOAT, false, 144, 80);
    gl.vertexAttribPointer(pointsNumberLoc, 4, gl.FLOAT, false, 144, 96);
    gl.vertexAttribPointer(riseAnimationVLoc, 4, gl.FLOAT, false, 144, 112);
    gl.vertexAttribPointer(stayBackTimeLoc, 4, gl.FLOAT, false, 144, 128);    
    gl.drawArrays(gl.POINTS, 0, counter);
}

//Atualiza o tempo global
function updateGlobalTime(){
    gl.useProgram(program2);
    globalTimeLoc = gl.getUniformLocation(program2,"globalTime");
    globalTime += 1/60;
    gl.uniform1f(globalTimeLoc, globalTime);
}
