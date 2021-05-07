import React, { useState } from "react";
import { Col, Container, Form, Row} from "react-bootstrap";
// import {RGBA} from "../PBN/PBN";

interface PalleteSizeProps {
    palleteSizeUpdatedCallback : (num : number) => void;
    defaultSize : number;
}

export const PalleteSize : React.FC<PalleteSizeProps> = (props) => {
    const [numColors , setNumColors] = useState(props.defaultSize);

    const numColorsUpdated  = (e : any) => {
        let num = e.currentTarget.value;
        props.palleteSizeUpdatedCallback(num);
        setNumColors(num);
    }


    return (
        <Container className="py-3">
            <Row className = "justify-content-center">
                <Col>
                    <Form>
                        <Form.Group controlId="palleteSize">
                            <Form.Label>Pallete Size (how many colors are in your pallete): {numColors}</Form.Label>
                            <Form.Control type="range" max={30} min={2} defaultValue={numColors} onChange={numColorsUpdated}/>
                        </Form.Group>
                    </Form>     
                </Col>
            </Row>
            
        </Container>
    )
}