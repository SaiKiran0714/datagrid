// // Minimal filter summary with chips and clear-all button
// import { Box, Button, Chip } from "@mui/material";

// export default function FilterParameters({
//   columns = [],
//   value = [],
//   onChange = () => {},
//   types = {},
//   searchTerm,
//   onClearSearch,
// }) {
//   const inferType = (name) => types[name] || "text";

//   const removeAt = (i) => {
//     const next = value.filter((_, idx) => idx !== i);
//     onChange(next);
//   };

//   const clearAll = () => onChange([]);

//   const prettyField = (name) => String(name).replace(/_/g, " ");
//   const formatChipLabel = (f) => {
//     const field = prettyField(f.field);
//     const t = inferType(f.field);
//     const v = f.value;
//     const quoted = v !== undefined && v !== "" ? `"${v}"` : undefined;
//     switch (f.op) {
//       case "contains":
//         return `${field} contains ${quoted ?? '""'}`;
//       case "notContains":
//         return `${field} does not contain ${quoted ?? '""'}`;
//       case "equals":
//         if (t === "boolean") return `${field} is ${v}`;
//         return `${field} equals ${quoted ?? '""'}`;
//       case "notEquals":
//       case "notEqualsNumber":
//         if (t === "boolean") return `${field} is not ${v}`;
//         return `${field} does not equal ${quoted ?? '""'}`;
//       case "startsWith":
//         return `${field} starts with ${quoted ?? '""'}`;
//       case "endsWith":
//         return `${field} ends with ${quoted ?? '""'}`;
//       case "isEmpty":
//         return `${field} is empty`;
//       case "notEmpty":
//         return `${field} is not empty`;
//       case "gt":
//       case "greaterThan":
//         return `${field} greater than ${v ?? ""}`;
//       case "lt":
//       case "lessThan":
//         return `${field} less than ${v ?? ""}`;
//       case "in":
//         return `${field} in (${(Array.isArray(f.values) ? f.values : []).join(", ")})`;
//       default:
//         return `${field}`;
//     }
//   };

//   return (
//     <Box sx={{ mt: 1 }}>
//       <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
//         {searchTerm && (
//           <Chip
//             size="small"
//             label={`Search: "${searchTerm}"`}
//             color="primary"
//             onDelete={onClearSearch}
//           />
//         )}
//         {value.flatMap((f, i) => {
//           if (f.op === "in" && Array.isArray(f.values)) {
//             return f.values.map((v, j) => (
//               <Chip
//                 key={`${f.field}-${v}-${i}-${j}`}
//                 size="small"
//                 label={`${f.field} = "${v}"`}
//                 onDelete={() => {
//                   const rest = f.values.filter((x) => x !== v);
//                   const next = [...value];
//                   if (rest.length) next[i] = { ...f, values: rest };
//                   else next.splice(i, 1);
//                   onChange(next);
//                 }}
//               />
//             ));
//           }
//           return [
//             <Chip
//               key={`${f.field}-${i}`}
//               size="small"
//               label={formatChipLabel(f)}
//               onDelete={() => removeAt(i)}
//             />,
//           ];
//         })}
//       </Box>
//       <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
//         <Button size="small" onClick={clearAll} disabled={value.length === 0}>
//           Clear all filters
//         </Button>
//       </Box>
//     </Box>
//   );
// }
