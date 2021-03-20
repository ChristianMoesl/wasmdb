import { expect } from "chai";
import { parse } from "../../src/parser/sql-grammar";

const t1gram =
  "t1gram.csv schema Phrase, Year, MatchCount, VolumeCount delim \\t";

describe("sql-parser", () => {
  it("query 1", () => {
    const query = "select a, b, c from t1.csv where a='b'";
    expect(parse(query)).to.equal(query);
  });
  it("query 2", () => {
    const query = "select * from t.csv";
    expect(parse(query)).to.equal(query);
  });
  it("query 3", () => {
    const query = "select Name from t.csv";
    expect(parse(query)).to.equal(query);
  });
  it("query 4", () => {
    const query = "select Name from t.csv where Flag='yes'";
    expect(parse(query)).to.equal(query);
  });
  it("query 5", () => {
    const query =
      "select * from nestedloops t.csv join (select Name as Name1 from t.csv)";
    expect(parse(query)).to.equal(query);
  });
  it("query 6", () => {
    const query =
      "select * from nestedloops t.csv join (select Name from t.csv)";
    expect(parse(query)).to.equal(query);
  });
  it("query 7", () => {
    const query = "select * from t.csv join (select Name as Name1 from t.csv)";
    expect(parse(query)).to.equal(query);
  });
  it("query 8", () => {
    const query = "select * from t.csv join (select Name from t.csv)";
    expect(parse(query)).to.equal(query);
  });
  it("query 9", () => {
    const query = "select * from t.csv group by Name sum Value"; // not 100% right syntax, but hey ...
    expect(parse(query)).to.equal(query);
  });
  it("query 10", () => {
    const query = `select * from ${t1gram}`;
    expect(parse(query)).to.equal(query);
  });
  it("query 11", () => {
    const query = `select * from ${t1gram} where Phrase='Auswanderung'`;
    expect(parse(query)).to.equal(query);
  });
  it("query 12", () => {
    const query = `select * from nestedloops words.csv join (select Phrase as Word, Year, MatchCount, VolumeCount from ${t1gram})`;
    expect(parse(query)).to.equal(query);
  });
  it("query 13", () => {
    const query = `select * from words.csv join (select Phrase as Word, Year, MatchCount, VolumeCount from ${t1gram})`;
    expect(parse(query)).to.equal(query);
  });
  it("query 14", () => {
    const query = `select * from nestedloops words.csv join (select * from ${t1gram})`;
    expect(parse(query)).to.equal(query);
  });
  it("query 15", () => {
    const query = `select * from words.csv join (select * from ${t1gram})`;
    expect(parse(query)).to.equal(query);
  });
  it("query 16", () => {
    const query = `select * from nestedloops words.csv join (select Phrase as Word, Year, MatchCount, VolumeCount from ${t1gram})`;
    expect(parse(query)).to.equal(query);
  });
  it("query 17", () => {
    const query = `select * from words.csv join (select Phrase as Word, Year, MatchCount, VolumeCount from ${t1gram})`;
    expect(parse(query)).to.equal(query);
  });
});
