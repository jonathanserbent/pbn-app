import React, { useState } from "react";
import { Col, Container, Row, ToggleButton, ToggleButtonGroup} from "react-bootstrap";
// import {RGBA} from "../PBN/PBN";

interface ImagePickerProps {
    pickerCallback : (type : string) => void;
}

export const ImagePicker : React.FC<ImagePickerProps> = (props) => {
    const [current , setCurrent] = useState("base");

    const buttonChange = (value : string) => {
        setCurrent(value);
        props.pickerCallback(value);

    }

    return (
        <Container className="py-3">
            <Row className = "justify-content-center">
                <Col>
                    <ToggleButtonGroup className="mb-2" value={current} onChange={buttonChange} name="options">
                        <ToggleButton type="radio" value="base" >
                            Show Base Image
                        </ToggleButton>
                        <ToggleButton type="radio" value="color" >
                            Show Color Image
                        </ToggleButton>
                        <ToggleButton type="radio" value="pbn"  >
                            Show PBN Image
                        </ToggleButton>
                    </ToggleButtonGroup>           
                </Col>
            </Row>
            
        </Container>
    )
}
