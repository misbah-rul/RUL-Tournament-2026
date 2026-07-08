import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/Import.tsx', 'utf8');

const processFileForPreviewRegex = /const processFileForPreview = async \(selectedFile: File\) => \{[\s\S]*?setPreviewSummary\(\{[\s\S]*?\}\);\s*\} catch \(err\) \{/;

const newProcessFileForPreview = `const processFileForPreview = async (selectedFile: File) => {
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
      const dbPlayerNames = new Set((dbPlayers || []).map(p => p.name.toLowerCase().trim()));

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
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: \`Unknown player: \${p1}\` });
                        hasError = true;
                    }
                    if (p2 && !dbPlayerNames.has(p2.toLowerCase()) && !parsedPlayers.has(p2)) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: \`Unknown player: \${p2}\` });
                        hasError = true;
                    }
                }

                if (date) {
                    const parsedDate = new Date(date);
                    if (isNaN(parsedDate.getTime()) && isNaN(Number(date))) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: \`Invalid date format: \${date}\` });
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
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: \`Duplicate match number: \${matchNo}\` });
                        hasError = true;
                    } else {
                        seenMatchNumbers.add(matchNo);
                    }
                }
                
                let p1Score, p2Score;
                if (s1 !== "") {
                    p1Score = Number(s1);
                    if (isNaN(p1Score)) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: \`Invalid score value for Player 1: \${s1}\` });
                        hasError = true;
                    } else if (p1Score < 0) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: \`Negative score for Player 1: \${p1Score}\` });
                        hasError = true;
                    }
                }
                if (s2 !== "") {
                    p2Score = Number(s2);
                    if (isNaN(p2Score)) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: \`Invalid score value for Player 2: \${s2}\` });
                        hasError = true;
                    } else if (p2Score < 0) {
                        validationErrors.push({ row: rowNum, sheet: sheetName, message: \`Negative score for Player 2: \${p2Score}\` });
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

    } catch (err)`;

if (content.match(processFileForPreviewRegex)) {
  content = content.replace(processFileForPreviewRegex, newProcessFileForPreview);
  fs.writeFileSync('src/pages/admin/Import.tsx', content);
  console.log("Replaced processFileForPreview");
} else {
  console.log("Could not find processFileForPreview block");
}
