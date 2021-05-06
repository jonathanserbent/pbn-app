import React from "react";
import {PBNRenderer, setTexture, redrawCanvas} from './PBNRenderer';
import {ImageLoader} from '../imageLoader/imageLoader';

// let mat : Array<Array<RGBA>>;

export const PBN : React.FC<{}> = (props) => {
    
    let matCallback = (m : Array<Array<RGBA>>) => {
        // mat = m;
        // console.log("Pixels in the image:");
        // printMat()
        setTexture(m);
        redrawCanvas();
    }
    return (
        <div>
            <ImageLoader imageCallback={matCallback}/>
            <PBNRenderer/>
        </div>
    );
}

// Really just a copy from JIMP
export interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

// const printMat = () => {
//     console.log(mat);
//     // let gl = getContext("webgl") as WebGLRenderingContext;
// }