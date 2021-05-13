import React from "react";
import {PBNRenderer, setTexture, redrawCanvas} from './PBNRenderer';
import {ImageLoader} from '../imageLoader/imageLoader';
import Jimp from "jimp";
import { Picture } from "./Picture";
import { Button, Col, Container, Row } from "react-bootstrap";
import { ImagePicker } from "../imageLoader/imagePicker";
import { PalleteSize } from "../imageLoader/palleteSize";
// import { URL } from "url";

const kmeans = require("node-kmeans"); // Ew, gross javascript, but hey it works
// This interface helps us with typing the results
interface kMeanResult {
    centroid : number[],
}

let encode = require('image-encode') // Another unfortunate js library

interface Point {
    x : number;
    y : number;
}

interface Region {
    points : Point[];
    outline : Point[];
}

const defaultPalleteSize = 10;

// Really just a copy from JIMP
export interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

interface PBNState {
    status: string;
}

const colorsSame = (left : RGBA, right : RGBA) : boolean => {
    let result = left.r === right.r &&
                 left.g === right.g &&
                 left.b === right.b &&
                 left.a === right.a;
    return result;
};

export class PBN extends React.Component<{}, PBNState> {
    baseImage : Picture | undefined;
    coloredImage : Picture | undefined;
    pbnImage : Picture | undefined;
    pallete : RGBA[];
    palleteSize : number = defaultPalleteSize;

    constructor(props : any) {
        super(props);
        this.pallete = [];
        this.state = {status: "Awaiting Input"};
    }

    private generateColoredImage() {
        console.log("Generating colored image");
        let tempState = this.state as PBNState;
        tempState.status = "Generating colored image...";
        this.setState(tempState);

        if (!this.baseImage || this.pallete.length === 0) {
            console.error("Cannot generate colored image without base image or color pallete.");
            return;
        }

        this.coloredImage = Picture.fromPicture(this.baseImage);
        for (let y = 0; y < this.coloredImage.height; ++y) {
            for (let x = 0; x < this.coloredImage.width; ++x) {
                this.coloredImage.setPixelToClosestColor(x, y, this.pallete);
            }
        }

        tempState = this.state as PBNState;
        tempState.status = "Finished generating colored image.";
        this.setState(tempState);

        this.generatePBNImage();
    }

    private generatePBNImage() {
        console.log("Generating PBN image...");
        let tempState = this.state as PBNState;
        tempState.status = "Generating PBN image...";
        this.setState(tempState);

        if (!this.coloredImage) {
            console.error("Cannot generate PBN Image without the colored image.");
            return;
        }
        var visited = Array<Array<boolean>>(this.coloredImage.width);
        for (let i=0; i < this.coloredImage.width; ++i) {
            let temp = Array<boolean>(this.coloredImage.height);
            temp.fill(false);
            visited[i] = temp;
        }

        var regions : Region[] = [];
        for (let x=0; x<this.coloredImage.width; ++x) {
            for (let y=0; y<this.coloredImage.height; ++y) {
                let region = this.findOutline(this.coloredImage, visited, x, y);
                if (region) {
                    regions.push(region);
                }
            }
        }
        
        this.pbnImage = new Picture(this.coloredImage.width, this.coloredImage.height);
        const white = {r:255, g:255, b:255, a:255};
        const black = {r:0, g:0, b:0, a:255};
        this.pbnImage.fill(white);
        for (let i=0; i < regions.length; ++i) {
            let region = regions[i];
            for (let j=0; j< region.outline.length; ++j) {
                let p = region.outline[j];
                this.pbnImage.setPixel(p.x, p.y, black);
            }
        }

        tempState = this.state as PBNState;
        tempState.status = "Finished generatign PBN image.";
        this.setState(tempState);
    }

    private findOutline(pic : Picture, visited : boolean[][], startX : number, startY : number) : Region | null {
        let result : Region = {points: [], outline: []};
        let pos : Point = {x : startX, y : startY}; 
        let color = pic.getPixel(pos.x, pos.y);

        if (visited[pos.x][pos.y]) {
            return null;
        }


        let directions : Point[] = [{x : -1, y :  0},
                                    {x :  0, y :  1},
                                    {x :  1, y :  0},
                                    {x :  0, y : -1}];
        let startPos : Point = {x: pos.x, y: pos.y};
        let queue = [startPos];
        while(queue.length > 0) {
            // console.log("Visiting: " + pos.x + ", " + pos.y)
            pos = queue.pop() as Point;
            visited[pos.x][pos.y] = true;
            result.points.push(pos);
            for (let i=0; i < directions.length; ++i) {
                let dir = directions[i];
                let newPoint = {x : (pos.x + dir.x), y : (pos.y + dir.y)};
                let neighborColor = pic.getPixel(newPoint.x, newPoint.y);
                if (newPoint.x >= 0 && newPoint.y >= 0 && newPoint.x < pic.width && newPoint.y < pic.height &&
                    colorsSame(neighborColor, color) && (!visited[newPoint.x][newPoint.y])) {
                    queue.push(newPoint);
                }
                if (newPoint.x <= 0 || newPoint.y <= 0 || newPoint.x >= pic.width || newPoint.y >= pic.height ||
                    !colorsSame(neighborColor, color)) {
                    result.outline.push(pos);
                }
            }
        }       

        return result;
    }

    private generateDownloadLinks(type : string) {
        // Ideally type should be something like an enum instead
        let pic : Picture | undefined = undefined;
        if (type === "pbn") {
            pic = this.pbnImage;
        }
        else if(type === "colored") {
            pic = this.coloredImage;
        }
        if (!pic) {
            return;
        }

        let buf = Buffer.from(encode(pic.data, [pic.width, pic.height], 'png'));
        let blob = new Blob([buf]);
        let url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = type + ".png";
        document.body.appendChild(link);
        link.dispatchEvent(
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            })
        )
        document.body.removeChild(link);

        console.log("Download Complete");

    }

    private showImage(pic : Picture | undefined) {
        if (!pic) {
            return;
        }

        setTexture(pic);
        redrawCanvas();
    }

    private kmeansCallbackFactory () {
        let tempState = this.state as PBNState;
        tempState.status = "Picking color palette (this may take a while)...";
        this.setState(tempState);

        const result = (err : any, res : kMeanResult[]) =>{
            if (err) {
                console.error(err);
                let tempState = this.state as PBNState;
                tempState.status = "Error occurred while picking colors.";
                this.setState(tempState);
                return;
            }
            var colorPallete = new Array<RGBA>(res.length);
            for (let index in res) {
                let c = res[index].centroid;
                var color = {
                    r: Math.round(c[0]),
                    g: Math.round(c[1]),
                    b: Math.round(c[2]),
                    a: Math.round(c[3])
                };
                colorPallete[index] = color;
            }
            Object.assign(this.pallete, colorPallete);

            let tempState = this.state as PBNState;
            tempState.status = "Finished picking color pallete";
            this.setState(tempState);

            this.generateColoredImage();
        }
        return result;
    }

    private palleteSizeCallbackFactory () {
        const result = (num : number) => {
            
            this.palleteSize = num;
        }
        return result;
    }

    private pickerCallbackFactory () {
        const result = (type : string) => {
            if (type === "base") {
                this.showImage(this.baseImage);
            }
            else if (type === "color") {
                this.showImage(this.coloredImage);
            }
            else if (type === "pbn") {
                this.showImage(this.pbnImage);
            }

        }
        return result;
    }

    private imageUploadCallbackFactory () {
        const result = (jimp : Jimp) => {
            let tempState = this.state as PBNState;
            tempState.status = "Loading image...";
            this.setState(tempState);

            this.baseImage = Picture.fromJimp(jimp);
            this.showImage(this.baseImage);

            tempState = this.state as PBNState;
            tempState.status = "Image loaded, waiting to start.";
            this.setState(tempState);
        }

        return result;
    }

    private kickoffGeneration() {
        if (!this.baseImage){
            return;
        }
        kmeans.clusterize(this.baseImage.toRGBAVector(), {k:this.palleteSize}, this.kmeansCallbackFactory());
        console.log("Started Finding Colors.");
    }

    render () {
        const status = this.state.status;
        return (
            <Container fluid>
                <Row className="justify-content-center">
                    <Col>
                        <ImageLoader imageCallback={this.imageUploadCallbackFactory()}/>
                        <PalleteSize palleteSizeUpdatedCallback={this.palleteSizeCallbackFactory()} defaultSize={defaultPalleteSize}/>
                        <Container>
                            <Row className = "justify-content-center">
                                <Col>
                                    <Button onClick={() => this.kickoffGeneration()} >Create PBN Image</Button>                           
                                </Col>
                            </Row>
                        </Container>
                        <ImagePicker pickerCallback = {this.pickerCallbackFactory()}/>
                        <Container>
                            <Row className = "justify-content-center">
                                <Col>
                                    <h3 className="text-center">Status: {status}</h3>                           
                                </Col>
                            </Row>
                        </Container>
                        <PBNRenderer/>
                        <Container>
                            <Row className = "justify-content-center py-3">
                                <Col>
                                    <Button disabled={!this.coloredImage} onClick={() => this.generateDownloadLinks("colored")} >Download Colored image</Button>
                                </Col>
                                <Col>
                                    <Button disabled={!this.pbnImage} onClick={() => this.generateDownloadLinks("pbn")} >Download PBN image</Button>
                                </Col>
                            </Row>
                        </Container>
                    </Col>
                </Row>
                
            </Container>
        );
    }
}

