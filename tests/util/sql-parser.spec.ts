import { expect } from "chai"
import { parse } from "../../src/util/sql-parser"

function s(keyword: string) { return `<strong>${keyword}</strong>` }

const t1gram = "t1gram.csv schema Phrase, Year, MatchCount, VolumeCount delim \\t"

const t1grams = "t1gram.csv " + s("schema") + " Phrase, Year, MatchCount, VolumeCount " + s("delim") + " \\t"

describe('sql-parser', () => {
  it('query 1', () => {
    const colored = parse("select a,b,c from t1.csv where a='b'")
    expect(colored).to.equal(s("select") + " a,b,c " 
                           + s("from") + " t1.csv "
                           + s("where") + " a='b'")
  })
  it('query 2', () => {
    const colored = parse("select * from t.csv")
    expect(colored).to.equal(s("select") + " * " + 
                             s("from") + " t.csv")
  })
  it('query 3', () => {
    const colored = parse("select Name from t.csv")
    expect(colored).to.equal(s("select") + " Name " +
                             s("from") + " t.csv")
  })
  it('query 4', () => {
    const colored = parse("select Name from t.csv where Flag='yes'")
    expect(colored).to.equal(s("select") + " Name " +
                             s("from") + " t.csv " +
                             s("where") + " Flag='yes'")
  })
  it('query 5', () => {
    const colored = parse("select * from nestedloops t.csv join (select Name as Name1 from t.csv)")
    expect(colored).to.equal(s("select") + " * " +
                             s("from") + " " + 
                             s("nestedloops") + " t.csv " +
                             s("join") + " (" + 
                             s("select") + " Name " + 
                             s("as") + " Name1 " +
                             s("from") + " t.csv)")
  })
  it('query 6', () => {
    const colored = parse("select * from nestedloops t.csv join (select Name from t.csv)")
    expect(colored).to.equal(s("select") + " * " +
                             s("from") + " " + 
                             s("nestedloops") + " t.csv " +
                             s("join") + " (" + 
                             s("select") + " Name " +
                             s("from") + " t.csv)")
  })
  it('query 7', () => {
    const colored = parse("select * from t.csv join (select Name as Name1 from t.csv)")
    expect(colored).to.equal(s("select") + " * " +
                             s("from") + " t.csv " +
                             s("join") + " (" +
                             s("select") + " Name " +
                             s("as") + " Name1 " +
                             s("from") + " t.csv)")
  })
  it('query 8', () => {
    const colored = parse("select * from t.csv join (select Name from t.csv)")
    expect(colored).to.equal(s("select") + " * " + 
                             s("from") + " t.csv " +
                             s("join") + " (" + 
                             s("select") + " Name " +
                             s("from") + " t.csv)")
  })
  it('query 9', () => {
    const colored = parse("select * from t.csv group by Name sum Value") // not 100% right syntax, but hey ...
    expect(colored).to.equal(s("select") + " * " +
                             s("from") + " t.csv " +
                             s("group by") + " Name " + 
                             s("sum") + " Value")
  })
  it('query 10', () => {
    const colored = parse(`select * from ${t1gram}`)
    expect(colored).to.equal(s("select") + " * " +
                             s("from") + " " + t1grams)
  })
  it('query 11', () => {
    const colored = parse(`select * from ${t1gram} where Phrase='Auswanderung'`)
    expect(colored).to.equal(s("select") + " * " +
                             s("from") + " " + t1grams + " " +
                             s("where") + " Phrase='Auswanderung'")
  })
  it('query 12', () => {
    const colored = parse(`select * from nestedloops words.csv join (select Phrase as Word, Year, MatchCount, VolumeCount from ${t1gram})`)
    expect(colored).to.equal(s("select") + " * " + 
                             s("from") + " " +
                             s("nestedloops") + " words.csv " +
                             s("join") + " (" +
                             s("select") + " Phrase " +
                             s("as") + " Word, Year, MatchCount, VolumeCount " +
                             s("from") + " " + t1grams + ")")
  })
  it('query 13', () => {
    const colored = parse(`select * from words.csv join (select Phrase as Word, Year, MatchCount, VolumeCount from ${t1gram})`)
    expect(colored).to.equal(s("select") + " * " +
                             s("from") + " words.csv " + 
                             s("join") + " (" + 
                             s("select") + " Phrase " + 
                             s("as") + " Word, Year, MatchCount, VolumeCount " +
                             s("from") + " " + t1grams + ")")
  })
  it('query 14', () => {
    const colored = parse(`select * from nestedloops words.csv join (select * from ${t1gram})`)
    expect(colored).to.equal(s("select") + " * " +
                             s("from") + " " +
                             s("nestedloops") + " words.csv " +
                             s("join") + " (" +
                             s("select") + " * " +
                             s("from") + " " + t1grams + ")")
  })
  it('query 15', () => {
    const colored = parse(`select * from words.csv join (select * from ${t1gram})`)
    expect(colored).to.equal(s("select") + " * " +
                             s("from") + " words.csv " +
                             s("join") + " (" + 
                             s("select") + " * " +
                             s("from") + " " + t1grams + ")")
  })
  it('query 16', () => {
    const colored = parse(`select * from nestedloops words.csv join (select Phrase as Word, Year, MatchCount, VolumeCount from ${t1gram})`)
    expect(colored).to.equal(s("select") + " * " +
                             s("from") + " " +
                             s("nestedloops") + " words.csv " + 
                             s("join") + " (" + 
                             s("select") + " Phrase " +
                             s("as") + " Word, Year, MatchCount, VolumeCount " +
                             s("from") + " " + t1grams + ")")
  })
  it('query 17', () => {
    const colored = parse(`select * from words.csv join (select Phrase as Word, Year, MatchCount, VolumeCount from ${t1gram})`)
    expect(colored).to.equal(s("select") + " * " +
                             s("from") + " words.csv " +
                             s("join") + " (" + 
                             s("select") + " Phrase " +
                             s("as") + " Word, Year, MatchCount, VolumeCount " +
                             s("from") + " " + t1grams + ")")
  })
})
