import React, {useEffect} from "react";
import { RGBA } from "./PBN";

const planeVertShaderCode = `
attribute vec2 coordinates;

varying highp vec2 uv;
void main() {
    gl_Position = vec4(coordinates.x, coordinates.y , 0, 1.0);
    uv = (coordinates + 1.0)/2.0;
}
`;

const planeFragShaderCode = `
uniform sampler2D tex;
varying highp vec2 uv;
const highp vec3 bgColor = vec3(0.9, 0.9, 0.9); 
void main() {
    highp vec4 color = texture2D(tex, uv);
    gl_FragColor = vec4((gl_FragCoord.x)/400.0, 1.0 - (gl_FragCoord.y)/400.0, 0.0, 1.0);
    gl_FragColor = color;
}
`;



var canvasId : string;
var texture : WebGLTexture | null = null;
var textureLocation : WebGLUniformLocation | null = null;
var vertexBuffer : WebGLBuffer | null = null;
var indexBuffer : WebGLBuffer | null = null;
var verts : number[] = [-1.0, 1.0,  1.0, 1.0,  -1.0, -1.0,  1.0, -1.0];
var faces : number[] = [0, 1, 2, 1, 3, 2];

const initGLCanvas = (id : string) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas){
        console.log("Failed to find canvas to init webGL.");
        return;
    }

    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
    if (!gl){
        console.error("Failed to get webgl context");
        return;
    }
    
    // Create & Bind the VBO
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // unbind buffer

    // Create & Bind the VAO
    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); // unbind buffer

    // Set up shaders
    var planeVertShader = gl.createShader(gl.VERTEX_SHADER);
    if (!planeVertShader){
        console.error("Vertex Shader failed to load.")
        return;
    }
    gl.shaderSource(planeVertShader, planeVertShaderCode);
    gl.compileShader(planeVertShader);
    let compiled = gl.getShaderParameter(planeVertShader, gl.COMPILE_STATUS);
    if (!compiled) {
        console.error(gl.getShaderInfoLog(planeVertShader));
        return;
    }

    var planeFragShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!planeFragShader){
        console.error("Fragment Shader failed to load.")
        return;
    }
    gl.shaderSource(planeFragShader, planeFragShaderCode);
    gl.compileShader(planeFragShader);
    compiled = gl.getShaderParameter(planeFragShader, gl.COMPILE_STATUS);
    if (!compiled) {
        console.error(gl.getShaderInfoLog(planeFragShader));
        return;
    }

    // Create, attach, link, and use the shader program
    var shaderProgram = gl.createProgram();
    if (!shaderProgram) {
        console.error("Couldn't create the shader program.")
        return;
    }
    gl.attachShader(shaderProgram, planeVertShader);
    gl.attachShader(shaderProgram, planeFragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);
    let linked = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
    if (!linked) {
        console.error(gl.getProgramInfoLog(shaderProgram));
        return;
    }

    // Associate shader program with buffer objects
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var coord = gl.getAttribLocation(shaderProgram, "coordinates");
    gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Get texture location and pass the uniform in
    textureLocation = gl.getUniformLocation(shaderProgram, "tex");
    
    texture = gl.createTexture();
    if (!texture){
        console.error("GL Failed to created a texture.");
        return;
    }
    setTexture([[{r:0, g:0, b:255, a: 255}, {r:0, g:255, b:255, a: 255}], [{r:255, g:255, b:0, a: 255}, {r:0, g:255, b:0, a: 255}]]);

    // DRAW THE DAMN THING
    redrawCanvas();

    
}

export const setTexture = (mat : Array<Array<RGBA>>) => {
    if (!texture) {
        console.error("Cannot set texture until it has been instantiated in GL.");
        return;
    }
    const height = mat.length;
    const width = mat[0].length;
    let pixels = new Uint8Array(width * height * 4);
    for (let y=0; y < height; ++y) {
        for (let x=0; x < width; ++x) {
            let index = (y * width + x) * 4;
            let color = mat[height-y-1][x];
            pixels[index] = color.r;
            pixels[index+1] = color.g;
            pixels[index+2] = color.b;
            pixels[index+3] = color.a;
        }
    }
    console.log(pixels);

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas){
        console.log("Failed to find canvas to init webGL.");
        return;
    }

    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
    if (!gl){
        console.error("Failed to get webgl context");
        return;
    }
    const level = 0;
    const format = gl.RGBA;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, format, width, height, border, srcFormat, srcType, pixels);

    // gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    // gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // Prevents s-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // Prevents t-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
}

export const redrawCanvas = () => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas){
        console.log("Failed to find canvas to init webGL.");
        return;
    }

    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
    if (!gl){
        console.error("Failed to get webgl context");
        return;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(textureLocation, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawElements(gl.TRIANGLES, faces.length, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

interface PBNRendererProps {
    canvasId ?: string,
}

export const getContext : (type: string) => RenderingContext | null = (type) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas)
        return null;
    
    console.log("Found the canvas");
    const result = canvas.getContext(type) as RenderingContext | null;

    return result;
}

export const PBNRenderer : React.FC<PBNRendererProps> = (props) => {

    canvasId = String(props.canvasId);
    if (canvasId === "undefined") {
        canvasId = "gl-canvas";
    }

    useEffect ( () => {
        // Code to run once component is mounted
        initGLCanvas(canvasId);
    }, []);

    return <canvas id={canvasId} width="400" height="400" style = {{border: '1px solid black'}}/>
}