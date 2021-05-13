import Jimp from "jimp";
import { RGBA } from "./PBN";

export class Picture {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8Array;

    static fromJimp(jimp: Jimp) : Picture {
        var result = new Picture(jimp.getWidth(), jimp.getHeight());
        for (let y=0; y < result.height; ++y){
            for (let x=0; x < result.width; ++x) {
                let color = Jimp.intToRGBA(jimp.getPixelColor(x, y));
                result.setPixel(x, y, color);
            }
        }
        return result;
    }

    static fromPicture(other: Picture) : Picture {
        var result = new Picture(other.width, other.height);
        for (let y=0; y < result.height; ++y){
            for (let x=0; x < result.width; ++x) {
                let color = other.getPixel(x, y);
                result.setPixel(x, y, color);
            }
        }
        return result;
    }

    constructor(readonly _width : number, readonly _height : number, readonly _data?: Uint8Array) {
        this.width = _width;
        this.height = _height;
        this.data = new Uint8Array(_width * _height * 4);
        if (_data) {
            for (let i=0; i < _data.length; ++i) {
                this.data[i] = _data[i];
            }
        }
    }

    setPixel(x : number, y : number, color : RGBA) {
        let index = (y * this.width + x) * 4;
        this.data[index + 0] = color.r;
        this.data[index + 1] = color.g;
        this.data[index + 2] = color.b;
        this.data[index + 3] = color.a;
    }

    setPixelToClosestColor(x : number, y : number, colors : RGBA[]) {
        let pixelColor = this.getPixel(x, y);
        let closestDistance = 1000;
        let closestIndex = -1;
        for (let index = 0; index < colors.length; ++index) {
            let tempC = colors[index];
            let distance = Math.sqrt(Math.pow((pixelColor.r - tempC.r), 2) +
                                     Math.pow((pixelColor.g - tempC.g), 2) +
                                     Math.pow((pixelColor.b - tempC.b), 2));
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        }

        let newColor = colors[closestIndex];
        this.setPixel(x, y, newColor);
    }

    getPixel(x : number, y : number) : RGBA {
        let index = (y * this.width + x) * 4;
        var color : RGBA = { r:this.data[index + 0],
                             g:this.data[index + 1],
                             b:this.data[index + 2],
                             a:this.data[index + 3]
                           };
        return color;
    }

    toRGBAVector() : Array<Array<number>> {
        var result = new Array(this.data.length/4);
        for (let y=0; y<this.height; ++y) {
            for (let x=0; x < this.width; ++x) {
                let index = (y * this.width + x) * 4;
                var color = [this.data[index + 0],
                             this.data[index + 1],
                             this.data[index + 2],
                             this.data[index + 3]];
                result[index/4] = color;
            }
        }
        return result;
    }

    fill(color : RGBA) {
        for (let x=0; x<this.width; ++x) {
            for (let y=0; y < this.height; ++y) {
                this.setPixel(x,y, color);
            }
        }
    }

}