import React from "react";
import { Media, Row, Card, CardImg, CardTitle, CardSubtitle, CardBody, CardText, Button } from "reactstrap";
import Col from "reactstrap/lib/Col";

const Monitor = () => (
  <Row><Col md="3" xs="6"><Card>
    <CardImg top width="100%" src="https://kenkoooo.com/atcoder/monitor/postgresql-ebs.png" alt="Card image cap" />
    <CardBody>
      <CardTitle>Remaining BurstBalance of PostgreSQL</CardTitle>
      <CardSubtitle>
        If this value reaches 0, the I/O operations to the database will be restricted and the API server and the crawlers will be killed.
      </CardSubtitle>
    </CardBody>
  </Card></Col></Row>);

export default Monitor;
