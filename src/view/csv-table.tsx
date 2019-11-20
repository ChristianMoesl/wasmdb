import React from "react"
import {List} from "immutable"
import { VariableSizeList } from "react-window"

export type Props = {
  fragments: List<string>,
  delimiter: string,
  saveFile: (name: string) => void,
}

export default function CsvTable(props: Props) {

  function calculateRowHeight(idx: number) {
    return props.fragments.get(idx)!.split(props.delimiter).length * 24
  }

  return (
      <section id="result-section">
        <div className="row">
          <div className="col-6"><h3>Results</h3></div>
          <div className="col-6 d-flex justify-content-end">
            <button className="btn my-button" type="button"
                    disabled={props.fragments.size === 0}
                    onClick={ () => props.saveFile("result.csv") }>Save</button>
          </div>
        </div>

        <figure className="highlight">
          <VariableSizeList
          className="List"
          height={400}
          itemCount={props.fragments.size}
          itemSize={idx => calculateRowHeight(idx)}
          width={"100%"}>
          {(row: { index: number, style: any }) =>
              <div style={row.style}>{
                props.fragments.get(row.index)!.split("\n")
                .map((line, key) => <div key={key}>{line}</div>)
              }</div>}
          </VariableSizeList>
          <div id="results" style={{ width: "100%" }}></div>
        </figure>
      </section>
  )
}

CsvTable.defaultProps = {
  fragments: List(),
  delimiter: ",",
}

