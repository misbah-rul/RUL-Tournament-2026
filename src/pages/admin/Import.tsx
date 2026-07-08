import React, { useState, useRef, DragEvent } from 'react';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, FileUp, X, Eye, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

const RECOGNIZED_SHEETS = [
  'fixtures',
  'fixtures (2)',
  'players',
  'knockout',
  'data entry',
  'standings',
  'playing fixture'
];

interface PreviewSummary {
  players: string[];
  playersFound: number;
  duplicatePlayers: number;
  fixtures: any[];
  validSheets: string[];
  ignoredSheets: string[];
  validationErrors: { row: number, sheet: string, message: string }[];
}

export function AdminImport() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; sheets: string[] } | null>(null);
  const [previewSummary, setPreviewSummary] = useState<PreviewSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [results, setResults] = useState<{ type: string; count: number; status: 'success' | 'error'; message: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFileForPreview = async (selectedFile: File) => {
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const sheetNames = workbook.SheetNames;
      const validSheets = sheetNames.filter(name => RECOGNIZED_SHEETS.includes(name.toLowerCase().trim()));
      const ignoredSheets = sheetNames.filter(name => !RECOGNIZED_SHEETS.includes(name.toLowerCase().trim()));
      
      const parsedPlayers = new Set<string>();
      const parsedFixtures: any[] = [];
      const validationErrors: { row: number, sheet: string, message: string }[] = [];
      let playersFound = 0;
      const seenMatchNumbers = new Set<string>();
      
      const { data: dbPlayers } = await supabase.from('players').select('name');
      const dbPlayerNames = new Set(((dbPlayers as any[]) || []).map(p => p.name.toLowerCase().trim()));

      // 1. Process players sheet if any
      const playersSheetName = validSheets.find(s => s.toLowerCase().trim() === 'players');
      if (playersSheetName) {
          const sheet = workbook.Sheets[playersSheetName];
          const dataObj = XLSX.utils.sheet_to_json(sheet) as any[];
          dataObj.forEach(row => {
              const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('player'));
              if (nameKey && row[nameKey]) {
                  const name = String(row[nameKey]).trim();
                  if (name) {
                      playersFound++;
                      parsedPlayers.add(name);
                  }
              }
          });
      }

      // 2. Process other valid sheets
      for (const sheetName of validSheets) {
        const sheet = workbook.Sheets[sheetName];
        const nameLower = sheetName.toLowerCase().trim();
        
        if (['fixtures', 'fixtures (2)', 'knockout', 'playing fixture', 'data entry', 'results'].includes(nameLower)) {
            const dataObj = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];
            
            dataObj.forEach((row, idx) => {
                const rowNum = idx + 2;
                
                const p1Key = Object.keys(row).find(k => k.toLowerCase().includes('player 1') || k.toLowerCase() === 'team 1' || k.toLowerCase() === 'home' || k.toLowerCase() === 'player 01');
                const p2Key = Object.keys(row).find(k => k.toLowerCase().includes('player 2') || k.toLowerCase() === 'team 2' || k.toLowerCase() === 'away' || k.toLowerCase() === 'player 02');
                const s1Key = Object.keys(row).find(k => k.toLowerCase().includes('score 1') || k.toLowerCase() === 'home score' || k.toLowerCase() === 'home goals');
                const s2Key = Object.keys(row).find(k => k.toLowerCase().includes('score 2') || k.toLowerCase() === 'away score' || k.toLowerCase() === 'away goals');
                const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('date'));
                const timeKey = Object.keys(row).find(k => k.toLowerCase().includes('time'));
                const matchKey = Object.keys(row).find(k => k.toLowerCase().includes('match'));
                
                if (!p1Key || !p2Key) {
                    if (Object.keys(row).some(k => row[k] !== "")) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: "Missing Player 1 or Player 2 columns." });
                    }
                    return;
                }
                
                const p1 = String(row[p1Key]).trim();
                const p2 = String(row[p2Key]).trim();
                let date = dateKey ? String(row[dateKey]).trim() : '';
                const time = timeKey ? String(row[timeKey]).trim() : '';
                const matchNo = matchKey ? String(row[matchKey]).trim() : '';
                const s1 = s1Key ? String(row[s1Key]).trim() : '';
                const s2 = s2Key ? String(row[s2Key]).trim() : '';
                
                let hasError = false;

                if (!p1 || !p2) {
                    validationErrors.push({ row: rowNum, sheet: sheetName, message: "Blank player names are not allowed." });
                    hasError = true;
                } else {
                    if (!playersSheetName && !parsedPlayers.has(p1)) {
                        playersFound++;
                        parsedPlayers.add(p1);
                    }
                    if (!playersSheetName && !parsedPlayers.has(p2)) {
                        playersFound++;
                        parsedPlayers.add(p2);
                    }
                }

                if (dbPlayerNames.size > 0 || playersSheetName) {
                    if (p1 && !dbPlayerNames.has(p1.toLowerCase()) && !parsedPlayers.has(p1)) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: `Unknown player: ${p1}` });
                        hasError = true;
                    }
                    if (p2 && !dbPlayerNames.has(p2.toLowerCase()) && !parsedPlayers.has(p2)) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: `Unknown player: ${p2}` });
                        hasError = true;
                    }
                }

                if (date) {
                    const parsedDate = new Date(date);
                    if (isNaN(parsedDate.getTime()) && isNaN(Number(date))) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: `Invalid date format: ${date}` });
                        hasError = true;
                    } else if (!isNaN(Number(date))) {
                        // Excel serial date to JS Date
                        const excelEpoch = new Date(1899, 11, 30);
                        const jsDate = new Date(excelEpoch.getTime() + (Number(date) * 86400000));
                        date = jsDate.toISOString().split('T')[0];
                    } else {
                        date = parsedDate.toISOString().split('T')[0];
                    }
                }
                
                if (matchNo) {
                    if (seenMatchNumbers.has(matchNo)) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: `Duplicate match number: ${matchNo}` });
                        hasError = true;
                    } else {
                        seenMatchNumbers.add(matchNo);
                    }
                }
                
                let p1Score, p2Score;
                if (s1 !== "") {
                    p1Score = Number(s1);
                    if (isNaN(p1Score)) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: `Invalid score value for Player 1: ${s1}` });
                        hasError = true;
                    } else if (p1Score < 0) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: `Negative score for Player 1: ${p1Score}` });
                        hasError = true;
                    }
                }
                if (s2 !== "") {
                    p2Score = Number(s2);
                    if (isNaN(p2Score)) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: `Invalid score value for Player 2: ${s2}` });
                        hasError = true;
                    } else if (p2Score < 0) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: `Negative score for Player 2: ${p2Score}` });
                        hasError = true;
                    }
                }
                
                if (!hasError && p1 && p2) {
                    parsedFixtures.push({
                        p1,
                        p2,
                        date,
                        time,
                        matchNo,
                        p1Score,
                        p2Score
                    });
                }
            });
        }
      }

      setFileInfo({
        name: selectedFile.name,
        size: (selectedFile.size / 1024).toFixed(2) + ' KB',
        sheets: workbook.SheetNames
      });
      
      const fixtureCounts = new Map<string, number>();
      parsedFixtures.forEach((f) => {
        if (f.p1 && f.p2) {
          const key = [f.p1, f.p2].sort().join('::');
          fixtureCounts.set(key, (fixtureCounts.get(key) || 0) + 1);
        }
      });
      
      const fixturesWithFlags = parsedFixtures.map(f => {
        let isDuplicate = false;
        if (f.p1 && f.p2) {
          const key = [f.p1, f.p2].sort().join('::');
          isDuplicate = (fixtureCounts.get(key) || 0) > 1;
        }
        
        return {
          ...f,
          isDuplicate,
          isMissingPlayer: !f.p1 || !f.p2,
          isMissingDate: !f.date,
          hasInvalidValues: (f.p1Score !== undefined && f.p1Score !== null && isNaN(f.p1Score)) || (f.p2Score !== undefined && f.p2Score !== null && isNaN(f.p2Score))
        };
      });
      
      setPreviewSummary({
        players: Array.from(parsedPlayers),
        playersFound,
        duplicatePlayers: playersFound - parsedPlayers.size,
        fixtures: fixturesWithFlags,
        validSheets,
        ignoredSheets,
        validationErrors
      });

    } catch (err) {
      toast.error('Failed to read Excel file for preview');
      setFile(null);
    }
  };

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }
    setFile(selectedFile);
    setResults([]);
    await processFileForPreview(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setFileInfo(null);
    setPreviewSummary(null);
    setResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = async () => {
    if (!previewSummary) {
      toast.error("No data to import");
      return;
    }

    setIsProcessing(true);
    setResults([]);

    try {
      let playersFound = previewSummary.playersFound;
      let duplicatePlayers = previewSummary.duplicatePlayers;
      let playersImported = 0;
      let skippedPlayers = 0;
      
      let fixturesAdded = 0;
      let resultsImported = 0;
      let resultsUpdated = 0;
      let resultsSkipped = 0;

      if (previewSummary.players.length > 0) {
        const { data: existingPlayers } = await supabase.from('players').select('name');
        const existingNames = new Set(((existingPlayers as any[]) || []).map(p => p.name));
        
        const newPlayers = previewSummary.players
          .filter(name => {
            if (existingNames.has(name)) {
              skippedPlayers++;
              return false;
            }
            return true;
          })
          .map(name => ({ name }));
          
        if (newPlayers.length > 0) {
          const { error: playerError } = await supabase
            .from('players')
            .insert(newPlayers);
            
          if (playerError) throw playerError;
        }
        playersImported = newPlayers.length;
      }

      if (previewSummary.fixtures.length > 0) {
        const { data: allPlayers } = await supabase.from('players').select('id, name') as any;
        const playerMap = new Map(((allPlayers as any[]) || []).map(p => [p.name, p.id]));
        
        const { data: existingFixtures } = await supabase.from('fixtures').select('id, player1_id, player2_id') as any;
        const { data: existingResults } = await supabase.from('results').select('id, fixture_id') as any;
        
        const existingFixturesMap = new Map();
        ((existingFixtures as any[]) || []).forEach(f => {
          const key = `${f.player1_id}-${f.player2_id}`;
          if (!existingFixturesMap.has(key)) existingFixturesMap.set(key, []);
          existingFixturesMap.get(key).push(f.id);
        });
        
        const existingResultFixtures = new Set(((existingResults as any[]) || []).map(r => r.fixture_id));

        const fixturesToProcess = previewSummary.fixtures.map(f => {
          const player1_id = playerMap.get(f.p1);
          const player2_id = playerMap.get(f.p2);
          const hasScores = f.p1Score !== undefined && f.p1Score !== null && !isNaN(f.p1Score) && 
                            f.p2Score !== undefined && f.p2Score !== null && !isNaN(f.p2Score);
          
          return {
            player1_id,
            player2_id,
            date: f.date,
            time: f.time,
            status: hasScores ? 'completed' : 'scheduled',
            p1Score: f.p1Score,
            p2Score: f.p2Score,
            hasScores
          };
        }).filter(f => f.player1_id && f.player2_id);
        
        for (const fix of fixturesToProcess) {
          const key = `${fix.player1_id}-${fix.player2_id}`;
          let fixtureId = null;
          
          if (existingFixturesMap.has(key) && existingFixturesMap.get(key).length > 0) {
             fixtureId = existingFixturesMap.get(key)[0];
          } else {
             const { data: newFix, error: fixError } = await supabase
               .from('fixtures')
               .insert([{
                 player1_id: fix.player1_id,
                 player2_id: fix.player2_id,
                 date: fix.date,
                 time: fix.time,
                 status: fix.status
               }] as any)
               .select()
               .single();
               
             if (!fixError && newFix) {
               fixtureId = (newFix as any).id;
               fixturesAdded++;
               existingFixturesMap.set(key, [fixtureId]);
             }
          }
          
          if (fixtureId) {
            if (fix.hasScores) {
               if (existingResultFixtures.has(fixtureId)) {
                  const { error: updateErr } = await (supabase
                    .from('results') as any)
                    .update({
                      player1_score: fix.p1Score,
                      player2_score: fix.p2Score
                    })
                    .eq('fixture_id', fixtureId);
                    
                  if (!updateErr) {
                    resultsUpdated++;
                    await (supabase.from('fixtures') as any).update({ status: 'completed' }).eq('id', fixtureId);
                  }
               } else {
                  const { error: insertErr } = await supabase
                    .from('results')
                    .insert([{
                      fixture_id: fixtureId,
                      player1_score: fix.p1Score,
                      player2_score: fix.p2Score
                    }] as any);
                    
                  if (!insertErr) {
                    resultsImported++;
                    existingResultFixtures.add(fixtureId);
                    await (supabase.from('fixtures') as any).update({ status: 'completed' }).eq('id', fixtureId);
                  }
               }
            } else {
               resultsSkipped++;
            }
          }
        }
      }

      const errorCount = previewSummary.validationErrors?.length || 0;
      const duplicateFixturesCount = previewSummary.fixtures.filter(f => f.isDuplicate).length;

      const finalResults: any[] = [
        { type: 'Players Imported', count: playersImported, status: 'success', message: '' },
        { type: 'Fixtures Imported', count: fixturesAdded, status: 'success', message: '' },
        { type: 'Results Imported', count: resultsImported + resultsUpdated, status: 'success', message: '' },
        { type: 'Players Skipped', count: skippedPlayers + duplicatePlayers, status: 'success', message: '' },
        { type: 'Duplicate Fixtures', count: duplicateFixturesCount, status: 'success', message: '' },
        { type: 'Errors', count: errorCount, status: 'success', message: '' }
      ];

      if (previewSummary.validSheets.some(s => s.toLowerCase() === 'standings' || s.toLowerCase() === 'data entry')) {
        finalResults.push({
          type: 'Standings Skipped',
          count: 0,
          status: 'success',
          message: 'The uploaded workbook contains a standings table. This application calculates standings automatically from match results. No standings were imported.'
        });
      }

      setResults(finalResults);
      
      toast.success("Data imported successfully");

    } catch (error: any) {
      console.error(error);
      toast.error(`Error importing data: ${error.message}`);
      setResults([{ type: 'Error', count: 0, status: 'error', message: error.message }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Import Data"
        description="Upload Excel files to populate the database with players, fixtures, and results."
      >
        <Button variant="outline" onClick={() => navigate('/admin/dashboard')} className="font-bold uppercase tracking-wider text-xs border-border">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </PageHeader>

      <Container className="py-8 md:py-12 max-w-5xl">
        {results.length > 0 && !isProcessing && results[0].type !== 'Error' ? (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                 <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Import Completed</h2>
              <p className="text-muted-foreground">Your data has been successfully imported into the database.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {results.map((res, idx) => (
                <div key={idx} className="border rounded-xl p-4 bg-background shadow-sm flex flex-col items-center justify-center text-center">
                  <p className="text-sm font-semibold text-muted-foreground">{res.type}</p>
                  <p className="text-3xl font-bold mt-2">{res.count}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 pt-6">
               <Button onClick={() => navigate('/admin/fixtures')} className="font-bold">Go to Fixtures</Button>
               <Button onClick={() => navigate('/standings')} variant="secondary" className="font-bold">Go to Standings</Button>
               <Button onClick={() => { setResults([]); handleCancel(); }} variant="outline" className="font-bold">Import Another File</Button>
            </div>
          </div>
        ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload Excel File</CardTitle>
              <CardDescription>
                Drag & drop or browse your .xlsx file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {!file ? (
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-secondary/20 hover:bg-secondary/40'} cursor-pointer`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                  />
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-background rounded-full shadow-sm border">
                      <FileUp className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold tracking-tight mb-2">Drag & Drop your file here</h4>
                  <p className="text-muted-foreground text-sm mb-6">Or click to browse from your computer</p>
                  
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="px-2 py-1 bg-background rounded-md border">.xlsx</span>
                    <span>Accepted formats</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-xl p-4 bg-background shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm truncate" title={fileInfo?.name}>{fileInfo?.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{fileInfo?.size}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isProcessing} className="text-muted-foreground hover:text-destructive shrink-0">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {previewSummary && (
                      <div className="mt-4 space-y-4 pt-4 border-t">
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Detected Recognized Sheets</p>
                          <div className="flex flex-wrap gap-2">
                            {previewSummary.validSheets.length > 0 ? previewSummary.validSheets.map(sheet => (
                              <span key={sheet} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md border border-emerald-200">
                                {sheet}
                              </span>
                            )) : (
                              <span className="text-xs text-muted-foreground italic">No recognized sheets found.</span>
                            )}
                          </div>
                        </div>
                        
                        {previewSummary.ignoredSheets.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Ignored Sheets</p>
                            <div className="flex flex-wrap gap-2">
                              {previewSummary.ignoredSheets.map(sheet => (
                                <span key={sheet} className="text-xs bg-secondary px-2 py-1 rounded-md border text-muted-foreground">
                                  {sheet}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-6 border rounded-lg bg-background overflow-hidden shadow-sm">
                          <Tabs defaultValue="summary">
                            <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 p-0 h-auto">
                               <TabsTrigger value="summary" className="rounded-none py-2.5 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-background">Summary</TabsTrigger>
                               <TabsTrigger value="players" className="rounded-none py-2.5 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-background">Players</TabsTrigger>
                               <TabsTrigger value="fixtures" className="rounded-none py-2.5 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-background">Fixtures</TabsTrigger>
                               <TabsTrigger value="results" className="rounded-none py-2.5 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-background">Results</TabsTrigger>
                               <TabsTrigger value="errors" className="rounded-none py-2.5 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-background">
                                 Errors {previewSummary.validationErrors?.length > 0 && <Badge variant="destructive" className="ml-2 px-1 py-0 h-4 text-[10px]">{previewSummary.validationErrors.length}</Badge>}
                               </TabsTrigger>
                            </TabsList>
                            <TabsContent value="summary" className="p-4 m-0">
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="border rounded-lg p-4 bg-muted/10">
                                     <p className="text-sm font-semibold text-muted-foreground">Players</p>
                                     <p className="text-2xl font-bold mt-1">{previewSummary.players.length}</p>
                                     <p className="text-xs text-muted-foreground mt-2">{previewSummary.playersFound} found, {previewSummary.duplicatePlayers} duplicates</p>
                                  </div>
                                  <div className="border rounded-lg p-4 bg-muted/10">
                                     <p className="text-sm font-semibold text-muted-foreground">Fixtures</p>
                                     <p className="text-2xl font-bold mt-1">{previewSummary.fixtures.length}</p>
                                     <p className="text-xs text-muted-foreground mt-2">{previewSummary.fixtures.filter(f => f.isDuplicate).length} duplicate warnings</p>
                                  </div>
                                  <div className="border rounded-lg p-4 bg-muted/10">
                                     <p className="text-sm font-semibold text-muted-foreground">Results</p>
                                     <p className="text-2xl font-bold mt-1">{previewSummary.fixtures.filter(f => typeof f.p1Score === 'number' && !isNaN(f.p1Score) && typeof f.p2Score === 'number' && !isNaN(f.p2Score)).length}</p>
                                  </div>
                                  <div className="border rounded-lg p-4 bg-red-50/50">
                                     <p className="text-sm font-semibold text-red-600 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/> Errors</p>
                                     <p className="text-2xl font-bold text-red-600 mt-1">{previewSummary.validationErrors?.length || 0}</p>
                                     <p className="text-xs text-red-600/70 mt-2">Needs review</p>
                                  </div>
                               </div>
                            </TabsContent>
                            <TabsContent value="players" className="p-0 m-0 border-t">
                               <div className="max-h-[300px] overflow-auto">
                                 <Table>
                                    <TableHeader className="bg-muted/30 sticky top-0">
                                       <TableRow>
                                          <TableHead>Name</TableHead>
                                       </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                       {previewSummary.players.length > 0 ? previewSummary.players.map((p, i) => (
                                          <TableRow key={i}>
                                             <TableCell className="font-medium">{p}</TableCell>
                                          </TableRow>
                                       )) : (
                                          <TableRow>
                                             <TableCell className="text-center text-muted-foreground h-24">No players found</TableCell>
                                          </TableRow>
                                       )}
                                    </TableBody>
                                 </Table>
                               </div>
                            </TabsContent>
                            <TabsContent value="fixtures" className="p-0 m-0 border-t">
                               <div className="max-h-[300px] overflow-auto">
                                 <Table>
                                    <TableHeader className="bg-muted/30 sticky top-0">
                                       <TableRow>
                                          <TableHead className="w-16">Match No</TableHead>
                                          <TableHead>Player 01</TableHead>
                                          <TableHead>Player 02</TableHead>
                                          <TableHead>Date</TableHead>
                                          <TableHead>Time</TableHead>
                                          <TableHead>Status</TableHead>
                                       </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                       {previewSummary.fixtures.length > 0 ? previewSummary.fixtures.map((f, i) => {
                                          const hasError = f.isMissingPlayer || f.isMissingDate || f.hasInvalidValues || f.isDuplicate;
                                          return (
                                          <TableRow key={i} className={hasError ? 'bg-red-50/20' : ''}>
                                             <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                             <TableCell>
                                                {f.p1 || <Badge variant="destructive" className="px-1 text-[10px]">Missing Name</Badge>}
                                             </TableCell>
                                             <TableCell>
                                                {f.p2 || <Badge variant="destructive" className="px-1 text-[10px]">Missing Name</Badge>}
                                             </TableCell>
                                             <TableCell>
                                                {f.date || <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 px-1 text-[10px]">No Date</Badge>}
                                             </TableCell>
                                             <TableCell>{f.time}</TableCell>
                                             <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                   {f.isDuplicate && <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 px-1 text-[10px]">Duplicate Fixture</Badge>}
                                                   {f.hasInvalidValues && <Badge variant="destructive" className="px-1 text-[10px]">Invalid Values</Badge>}
                                                   {!f.isDuplicate && !f.hasInvalidValues && <span className="text-xs text-muted-foreground">{f.p1Score !== undefined ? 'Completed' : 'Scheduled'}</span>}
                                                </div>
                                             </TableCell>
                                          </TableRow>
                                       )}) : (
                                          <TableRow>
                                             <TableCell colSpan={6} className="text-center text-muted-foreground h-24">No fixtures found</TableCell>
                                          </TableRow>
                                       )}
                                    </TableBody>
                                 </Table>
                               </div>
                            </TabsContent>
                            <TabsContent value="results" className="p-0 m-0 border-t">
                               <div className="max-h-[300px] overflow-auto">
                                 <Table>
                                    <TableHeader className="bg-muted/30 sticky top-0">
                                       <TableRow>
                                          <TableHead className="w-16">Match</TableHead>
                                          <TableHead>Score</TableHead>
                                       </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                       {previewSummary.fixtures
                                          .map((f, i) => ({ ...f, originalIndex: i }))
                                          .filter(f => typeof f.p1Score === 'number' && !isNaN(f.p1Score) && typeof f.p2Score === 'number' && !isNaN(f.p2Score)).length > 0 ? previewSummary.fixtures
                                          .map((f, i) => ({ ...f, originalIndex: i }))
                                          .filter(f => typeof f.p1Score === 'number' && !isNaN(f.p1Score) && typeof f.p2Score === 'number' && !isNaN(f.p2Score))
                                          .map((f, i) => (
                                          <TableRow key={i}>
                                             <TableCell className="text-muted-foreground">{f.originalIndex + 1}</TableCell>
                                             <TableCell>
                                                <div className="flex items-center gap-3">
                                                   <span className="font-medium text-right min-w-[120px]">{f.p1}</span>
                                                   <Badge variant="secondary" className="px-2 font-mono">{f.p1Score}</Badge>
                                                   <span className="text-muted-foreground font-medium">-</span>
                                                   <Badge variant="secondary" className="px-2 font-mono">{f.p2Score}</Badge>
                                                   <span className="font-medium min-w-[120px]">{f.p2}</span>
                                                </div>
                                             </TableCell>
                                          </TableRow>
                                       )) : (
                                          <TableRow>
                                             <TableCell colSpan={2} className="text-center text-muted-foreground h-24">No results found</TableCell>
                                          </TableRow>
                                       )}
                                    </TableBody>
                                 </Table>
                               </div>
                            </TabsContent>

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

                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </CardContent>
            
            {file && (
              <CardFooter className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleCancel}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  className="w-full" 
                  onClick={processFile} 
                  disabled={isProcessing || !previewSummary?.validSheets.length}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Confirm Import
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>

          <div className="space-y-6">
            <h3 className="text-xl font-bold uppercase tracking-tight">Import Status</h3>
            
            {results.length === 0 && !isProcessing && (
              <div className="flex flex-col items-center justify-center h-[300px] text-center border-2 border-dashed border-border rounded-xl bg-secondary/20">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">Select and import a file to see results.</p>
              </div>
            )}
            
            {isProcessing && (
              <div className="flex flex-col items-center justify-center h-[300px] text-center border-2 border-dashed border-border rounded-xl bg-secondary/20">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="font-bold">Processing Data</p>
                <p className="text-muted-foreground text-sm mt-1">Reading and parsing Excel data, updating database...</p>
              </div>
            )}

            {results.length > 0 && results[0].type === 'Error' && (
              <div className="space-y-3">
                {results.map((res, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 ${res.status === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    {res.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`font-bold ${res.status === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>
                        {res.type}
                      </h4>
                      <p className={`text-sm ${res.status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {res.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
      </Container>
    </div>
  );
}


