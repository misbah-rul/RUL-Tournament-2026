import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/Import.tsx', 'utf8');

// Add "Errors" tab
content = content.replace(
  `<TabsTrigger value="results" className="rounded-none py-2.5 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-background">Results</TabsTrigger>`,
  `<TabsTrigger value="results" className="rounded-none py-2.5 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-background">Results</TabsTrigger>
                               <TabsTrigger value="errors" className="rounded-none py-2.5 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-background">
                                 Errors {previewSummary.validationErrors?.length > 0 && <Badge variant="destructive" className="ml-2 px-1 py-0 h-4 text-[10px]">{previewSummary.validationErrors.length}</Badge>}
                               </TabsTrigger>`
);

const newErrorsTab = `
                            <TabsContent value="errors" className="p-0 m-0 border-t">
                               <div className="max-h-[300px] overflow-auto">
                                 <Table>
                                    <TableHeader className="bg-muted/30 sticky top-0">
                                       <TableRow>
                                          <TableHead className="w-20">Row</TableHead>
                                          <TableHead className="w-32">Sheet</TableHead>
                                          <TableHead>Error Message</TableHead>
                                       </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                       {previewSummary.validationErrors?.length > 0 ? previewSummary.validationErrors.map((err, i) => (
                                          <TableRow key={i} className="bg-red-50/20">
                                             <TableCell className="font-mono text-muted-foreground">{err.row}</TableCell>
                                             <TableCell>{err.sheet}</TableCell>
                                             <TableCell className="text-red-600">{err.message}</TableCell>
                                          </TableRow>
                                       )) : (
                                          <TableRow>
                                             <TableCell colSpan={3} className="text-center text-muted-foreground h-24">No validation errors found</TableCell>
                                          </TableRow>
                                       )}
                                    </TableBody>
                                 </Table>
                               </div>
                            </TabsContent>
                          </Tabs>
`;

content = content.replace(
  `                          </Tabs>`,
  newErrorsTab
);

// Update Errors count in Summary tab
content = content.replace(
  `<p className="text-2xl font-bold text-red-600 mt-1">{previewSummary.fixtures.filter(f => f.isMissingPlayer || f.hasInvalidValues || f.isMissingDate).length}</p>`,
  `<p className="text-2xl font-bold text-red-600 mt-1">{previewSummary.validationErrors?.length || 0}</p>`
);

fs.writeFileSync('src/pages/admin/Import.tsx', content);
