statement = select

select = s:"select" _ l:("*" / fieldList) _ f:from { 
  return `select ${l} ${f}`;
}
from   = "from" _ j:join w:(_ where)? g:(_ group)? { 
  return `from ${j}${w ? " " + w[1] : ""}${g ? " " + g[1] : ""}`; 
}
where  = "where" _ p:predicate { 
  return `where ${p}`; 
}
group  = "group" _ "by" _ f1:fieldIdList _ "sum" _ f2:fieldIdList {
  return `group by ${f1} sum ${f2}`;
}
join = n:("nestedloops" _)? t:tableClause l:(_ "join" _ tableClause)* { 
  return l.reduce((r: any, e: any) => r + " join " + e[3], `${n ? "nestedloops " : ""}${t}`);
}
tableClause = c:((table (_ schema)?) / ( "(" _? statement _? ")")) { 
  if (c[0] === "(") {
    return `(${c[2]})`;
  }
  else {
    return `${c[0]}${c[1] ? " " + c[1][1] : ""}`;
  }
}
schema "schema" = "schema" _ f:fieldIdList d:(_ delimiter)? { 
  return `schema ${f}${d ? " " + d[1] : ""}`; 
}
delimiter "delimiter" = d:("delim" _ ( "\\t" / "." )) { 
  return `delim ${d[2]}`; 
}

predicate = l:ref _? "=" _? r:ref { 
  return `${l}=${r}`;
}
fieldList = h:fieldRename t:(_? "," _? fieldRename)* { 
  return t.reduce((r: any, e: any) => r + `, ${e[3]}`, h);  
}
fieldRename  = h:field t:(_ "as" _ field)? { 
  return `${h}${t ? " as " + t[3] : ""}`; 
}
fieldIdList = h:field t:(_? "," _? field)* { 
  return t.reduce((r: any, e: any) => r + `, ${e[3]}`, h); 
}

ref    = r:(field / string / integer) { return r; }

table "tablename" = t:[0-9a-zA-Z\.]+ { return t.join(""); }
field "fieldname" = f:[0-9a-zA-Z]+ { return f.join(""); }
string "string"   = s:("'" [^\']* "'") { return s[0] + s[1].join("") + s[2]; }
integer "integer" = d:[0-9]+ { return d.join(""); }

_ "whitespace" = w:[ \t\n\r]+ { return w.join(""); }
