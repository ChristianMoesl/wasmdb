import React from "react";
import { Container } from "@material-ui/core";
import Markdown from "./markdown";
import { readFileSync } from "fs";

export function Quickstart() {
  return (
    <Container maxWidth="md">
      <Markdown source={readFileSync("README.md").toString()} />
    </Container>
  );
}
