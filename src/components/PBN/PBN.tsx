import React from "react";
import {PBNRenderer, setTexture, redrawCanvas} from './PBNRenderer';
import {ImageLoader} from '../imageLoader/imageLoader';
import Jimp from "jimp/*";
import { Picture } from "./Picture";
import { Button, Col, Container, Row } from "react-bootstrap";
import { ImagePicker } from "../imageLoader/imagePicker";
import { PalleteSize } from "../imageLoader/palleteSize";

const kmeans = require("node-kmeans"); // Ew, gross javascript, but hey it works
// This interface helps us with typing the results
interface kMeanResult {
    centroid : number[],
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
        this.setState({status: "Generating colored image..."})
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
        this.setState({status: "Finished generating colored image."})
    }

    private showImage(pic : Picture | undefined) {
        if (!pic) {
            return;
        }

        setTexture(pic);
        redrawCanvas();
    }

    private kmeansCallbackFactory () {
        this.setState({status: "Picking color pallete (this may take a while)..."})
        const result = (err : any, res : kMeanResult[]) =>{
            if (err) {
                console.log(err);
                this.setState({status: "Error occurred while picking colors."})
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
            this.setState({status: "Finished picking color pallete."})

            // console.log(this.pallete);
            this.generateColoredImage();
            // this.showImage(this.coloredImage);
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
            this.setState({status: "Loading image..."})
            this.baseImage = Picture.fromJimp(jimp);
            this.showImage(this.baseImage);
            this.setState({status: "Image loaded, waiting to start."})
        }

        return result;
    }

    private createPBNImage() {
        if (!this.baseImage){
            return;
        }
        console.log(this.palleteSize);
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
                                    <Button onClick={() => this.createPBNImage()} >Create PBN Image</Button>                           
                                </Col>
                            </Row>
                        </Container>
                        <ImagePicker pickerCallback = {this.pickerCallbackFactory()}/>
                        <Container>
                            <Row className = "justify-content-center">
                                <Col>
                                    <p>Status: {status}</p>                           
                                </Col>
                            </Row>
                        </Container>
                        <PBNRenderer/>
                    </Col>
                </Row>
                
            </Container>
        );
    }
}

