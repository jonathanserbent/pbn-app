import React from "react";
import Jimp from "jimp";
import { Col, Container, Row } from "react-bootstrap";
// import {RGBA} from "../PBN/PBN";

interface ImageLoaderProps {
    imageCallback : (jimp : Jimp) => void;
}

export const ImageLoader : React.FC<ImageLoaderProps> = (props) => {
    const changeFunc = (event : React.ChangeEvent<HTMLInputElement>) => {
        event.persist();
        if (!event.currentTarget.files || event.currentTarget.files.length === 0)
            return;
        const file = event.currentTarget.files[0];
        const fr = new FileReader();
        fr.readAsArrayBuffer(file);
        fr.onload = () => {
            // console.log(fr.result);
                const imgBuffer = fr.result as Buffer;
                Jimp.read(imgBuffer, (err, value) => {
                    if (err){
                        console.error("Jimp Failed to Load Image with Message: " + err.message);
                        return;
                    }
                    
                    props.imageCallback(value);
                })
            

        };
        fr.onerror = () => {
            console.error("File Reader encountered an eorror");
        };

        // console.log(file);
    }

    return (
        <Container className="py-3">
            <Row className = "justify-content-center">
                <Col>
                    <input type="file" id="input" onChange={changeFunc}/>
                </Col>
            </Row>
            
        </Container>
    )
}
