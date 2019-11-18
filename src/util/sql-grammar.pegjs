statement = select

select = s:"select" w1:_ l:("*" / fieldList) w2:_ f:from { 
  return `<strong>${s}</strong>` + w1 + l + w2 + f; 
}
from   = f:"from" w1:_ j:join w:(_ where)? g:(_ group)? { 
  return `<strong>${f}</strong>` + w1 + j + (w ? w.join("") : "") + (g ? g.join("") : ""); 
}
where  = w:("where" _ predicate) { 
  return `<strong>${w[0]}</strong>${w[1]}${w[2]}`; 
}
group  = g:("group" _ "by" _ fieldIdList _ "sum" _ fieldIdList) {
  return `<strong>${g[0]}${g[1]}${g[2]}</strong>${g[3]}${g[4]}${g[5]}`
        + `<strong>${g[6]}</strong>${g[7]}${g[8]}`;
}

join = n:("nestedloops" _)? t:tableClause l:(_ "join" _ tableClause)* { 
  return (n ? `<strong>${n[0]}</strong>${n[1]}` : "") + t 
  + l.reduce((r: any, e: any) => r + e[0] + "<strong>" + e[1] + "</strong>" + e[2] + e[3], ""); 
}
tableClause = c:((table (_ schema)?) / ( "(" _? statement _? ")")) { 
  if (c[0] === "(") return c.map((x: any) => x || "").join("");
  else return c[0] + (c[1] ? c[1].join("") : "");
}
schema "schema" = s:("schema" _ fieldIdList) d:(_ delimiter)? { 
  return `<strong>${s[0]}</strong>${s[1]}${s[2]}` + (d ? d.join("") : ""); 
}
delimiter "delimiter" = d:("delim" _ ( "\\t" / "." )) { 
  return `<strong>${d[0]}</strong>${d[1]}${d[2]}`; 
}

predicate = p:(ref _? "=" _? ref) { 
  return p.map((x: any) => x || "").join(""); 
}
fieldList = h:fieldRename t:(_? "," _? fieldRename)* { 
  return t.reduce((r: any, e: any) => r + e.map((x: any) => x || "").join(""), h);  
}
fieldRename  = h:field t:(_ "as" _ field)? { 
  return h + (t ? `${t[0]}<strong>${t[1]}</strong>${t[2]}${t[3]}` : ""); 
}
fieldIdList = h:field t:(_? "," _? field)* { 
  return t.reduce((r: any, e: any) => r + e.map((x: any) => x || "").join(""), h); 
}

ref    = r:(field / string / integer) { return r; }

table "tablename" = t:[0-9a-zA-Z\.]+ { return t.join(""); }
field "fieldname" = f:[0-9a-zA-Z]+ { return f.join(""); }
string "string"   = s:("'" [^\']* "'") { return s[0] + s[1].join("") + s[2]; }
integer "integer" = d:[0-9]+ { return d.join(""); }

_ "whitespace" = w:[ \t\n\r]+ { return w.join(""); }
