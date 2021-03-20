import React, { PropsWithChildren, SyntheticEvent } from "react";
import {
  FormControl,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Typography,
  Link as MuiLink,
  TypographyProps,
} from "@material-ui/core";
const ReactMarkdown = require("react-markdown");
const gfm = require("remark-gfm");

// Glue code to use Material UI components in react-markdown

const Heading = (props: any) => (
  <Typography
    // @ts-ignore
    variant={"h" + props.level}
    {...props}
  >
    {props.children}
  </Typography>
);

const Body = (props: any) => (
  <Typography variant="body1" {...props}>
    {props.children}
  </Typography>
);

const Link = (props: any) => <MuiLink {...props}>{props.children}</MuiLink>;

export interface MarkdownProps {
  source: string;
}

export default function Markdown(props: MarkdownProps) {
  return (
    <ReactMarkdown
      plugins={[gfm]}
      children={props.source}
      renderers={{
        heading: Heading,
        paragraph: Body,
        link: Link,
        linkReference: Link,
      }}
    />
  );
}
