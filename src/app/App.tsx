import React from 'react';

import './App.css';
import {PBN} from "../components/PBN/PBN";
// import "bootstrap/dist/css/bootstrap.min.css";
import { Col, Container, Row } from 'react-bootstrap';

function App() {

  

  return (
    <Container className="App py-3">
      <Row className="justify-content-center">
        <Col>
          <h1 className="display-1 text-center">PBN App</h1>
          <PBN/>
        </Col>
      </Row>
      
      
    </Container>
  );
}

export default App;
