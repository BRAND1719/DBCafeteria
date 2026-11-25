/* =====================================================================
   excel.js - genera archivos de Excel (.xlsx) con tablas con formato
   y graficas de barras, sin librerias externas.

   exportarExcel('Clientes', [{
     nombre: 'Clientes',                              // nombre de la hoja
     titulo: 'Reporte de clientes',                   // (opcional) titulo arriba de la tabla
     columnas: [{ titulo: 'Nombre', valor: c => c.nombre },
                { titulo: 'Total', valor: p => p.total, formato: 'moneda' }],
     filas: [...],
     grafica: { titulo: 'Clientes por estatus', serie: 'Cantidad',
                datos: [['Activo', 10], ['Inactivo', 2]], formato: 'moneda' (opcional) }
   }]);
   ===================================================================== */
(function () {
  const enc = new TextEncoder();
  const x = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
    // quita caracteres de control que Excel no acepta
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  /* ---------- ZIP (sin compresion) ---------- */
  const tablaCrc = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = tablaCrc[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function zip(archivos) {
    const partes = [], central = [];
    let offset = 0;
    const ahora = new Date();
    const hora = (ahora.getHours() << 11) | (ahora.getMinutes() << 5) | (ahora.getSeconds() >> 1);
    const fecha = ((ahora.getFullYear() - 1980) << 9) | ((ahora.getMonth() + 1) << 5) | ahora.getDate();

    for (const [ruta, texto] of archivos) {
      const nombre = enc.encode(ruta);
      const datos = enc.encode(texto);
      const crc = crc32(datos);

      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
      local.setUint16(8, 0, true); local.setUint16(10, hora, true); local.setUint16(12, fecha, true);
      local.setUint32(14, crc, true); local.setUint32(18, datos.length, true); local.setUint32(22, datos.length, true);
      local.setUint16(26, nombre.length, true); local.setUint16(28, 0, true);
      partes.push(local, nombre, datos);

      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
      cen.setUint16(10, 0, true); cen.setUint16(12, hora, true); cen.setUint16(14, fecha, true);
      cen.setUint32(16, crc, true); cen.setUint32(20, datos.length, true); cen.setUint32(24, datos.length, true);
      cen.setUint16(28, nombre.length, true); cen.setUint32(42, offset, true);
      central.push(cen, nombre);

      offset += 30 + nombre.length + datos.length;
    }
    const tamCentral = central.reduce((s, p) => s + p.byteLength, 0);
    const fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true);
    fin.setUint32(12, tamCentral, true); fin.setUint32(16, offset, true);
    return new Blob([...partes, ...central, fin], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /* ---------- utilidades de celdas ---------- */
  const letra = n => { let s = ''; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const ref = (col, fila) => letra(col) + (fila + 1);                    // col y fila desde 0
  const abs = (hoja, c1, f1, c2, f2) => `'${hoja.replace(/'/g, "''")}'!$${letra(c1)}$${f1 + 1}:$${letra(c2)}$${f2 + 1}`;

  // estilos (indice en cellXfs de styles.xml)
  const ESTILO = { normal: 0, moneda: 1, entero: 2, titulo: 3, subtitulo: 4, encabezado: 5, decimal: 6 };
  // filas de datos con borde (7-10) y filas alternadas con fondo (11-14): normal, moneda, entero, decimal
  const estiloDe = (formato, fila = -1) => {
    const i = formato === 'moneda' ? 1 : formato === 'entero' ? 2 : formato === 'decimal' ? 3 : 0;
    if (fila < 0) return [ESTILO.normal, ESTILO.moneda, ESTILO.entero, ESTILO.decimal][i];
    return (fila % 2 ? 11 : 7) + i;
  };

  const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00"/><numFmt numFmtId="165" formatCode="#,##0"/></numFmts>
<fonts count="4">
<font><sz val="11"/><color rgb="FF18302E"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="16"/><color rgb="FF123C3A"/><name val="Calibri"/><family val="2"/></font>
<font><i/><sz val="10"/><color rgb="FF637B75"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF245D58"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFEAF3EF"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFD8E5DF"/></left><right style="thin"><color rgb="FFD8E5DF"/></right><top style="thin"><color rgb="FFD8E5DF"/></top><bottom style="thin"><color rgb="FFD8E5DF"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="15">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="2" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>
<xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="165" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="2" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium7" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;

  function graficaXml(titulo, serie, catRef, valRef, n, formato) {
    const fmt = formato === 'moneda' ? '"$"#,##0' : '#,##0';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<c:roundedCorners val="0"/>
<c:chart>
<c:title><c:tx><c:rich><a:bodyPr/><a:p><a:pPr><a:defRPr sz="1400" b="1"><a:solidFill><a:srgbClr val="123C3A"/></a:solidFill></a:defRPr></a:pPr><a:r><a:rPr lang="es-MX" sz="1400" b="1"><a:solidFill><a:srgbClr val="123C3A"/></a:solidFill></a:rPr><a:t>${x(titulo)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>
<c:autoTitleDeleted val="0"/>
<c:plotArea><c:layout/>
<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>
<c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:v>${x(serie)}</c:v></c:tx>
<c:spPr><a:solidFill><a:srgbClr val="D49B43"/></a:solidFill></c:spPr><c:invertIfNegative val="0"/>
<c:dLbls><c:numFmt formatCode="${x(fmt)}" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>
<c:cat><c:strRef><c:f>${x(catRef)}</c:f></c:strRef></c:cat>
<c:val><c:numRef><c:f>${x(valRef)}</c:f></c:numRef></c:val>
</c:ser>
<c:gapWidth val="${n > 8 ? 60 : 110}"/><c:axId val="111"/><c:axId val="222"/></c:barChart>
<c:catAx><c:axId val="111"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="222"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>
<c:valAx><c:axId val="222"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="D8E5DF"/></a:solidFill></a:ln></c:spPr></c:majorGridlines><c:numFmt formatCode="${x(fmt)}" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="111"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>
</c:plotArea>
<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/>
</c:chart>
<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="D8E5DF"/></a:solidFill></a:ln></c:spPr>
</c:chartSpace>`;
  }

  function dibujoXml(c1, f1, c2, f2) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<xdr:twoCellAnchor editAs="oneCell">
<xdr:from><xdr:col>${c1}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${f1}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
<xdr:to><xdr:col>${c2}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${f2}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Grafica 1"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>
<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/></a:graphicData></a:graphic>
</xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>
</xdr:wsDr>`;
  }

  function tablaXml(id, nombre, c1, f1, c2, f2, titulos) {
    const r = `${ref(c1, f1)}:${ref(c2, f2)}`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" id="${id}" name="${nombre}" displayName="${nombre}" ref="${r}" totalsRowShown="0">
<autoFilter ref="${r}"/>
<tableColumns count="${titulos.length}">${titulos.map((t, i) => `<tableColumn id="${i + 1}" name="${x(t)}"/>`).join('')}</tableColumns>
<tableStyleInfo name="TableStyleMedium7" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/>
</table>`;
  }

  // Encabezados de tabla: unicos y sin vacios (requisito de Excel)
  function titulosUnicos(lista) {
    const vistos = new Set();
    return lista.map((t, i) => {
      let base = String(t || ('Columna ' + (i + 1))).trim() || ('Columna ' + (i + 1)), n = base, k = 2;
      while (vistos.has(n.toLowerCase())) n = `${base} ${k++}`;
      vistos.add(n.toLowerCase());
      return n;
    });
  }

  /* ---------- libro completo ---------- */
  function construirLibro(hojas) {
    const archivos = [];
    const tipos = [];
    const relsLibro = [];
    let nTabla = 0, nGrafica = 0;
    const nombresHoja = new Set();

    const hojasXml = hojas.map((h, ih) => {
      const n = ih + 1;
      let nombre = String(h.nombre || ('Hoja' + n)).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31).trim() || ('Hoja' + n);
      while (nombresHoja.has(nombre.toLowerCase())) nombre = (nombre.slice(0, 28) + ' ' + n);
      nombresHoja.add(nombre.toLowerCase());

      const filasXml = [];
      const anchos = [];
      const celda = (c, f, v, estilo = 0) => {
        if (v === null || v === undefined || v === '') return estilo ? `<c r="${ref(c, f)}" s="${estilo}"/>` : '';
        const largo = typeof v === 'number' ? String(Math.round(v * 100) / 100).length + 4 : String(v).length;
        if (estilo !== ESTILO.titulo && estilo !== ESTILO.subtitulo) anchos[c] = Math.max(anchos[c] || 10, Math.min(50, largo + 3));
        if (typeof v === 'number' && isFinite(v)) return `<c r="${ref(c, f)}" s="${estilo}"><v>${v}</v></c>`;
        return `<c r="${ref(c, f)}" s="${estilo}" t="inlineStr"><is><t xml:space="preserve">${x(v)}</t></is></c>`;
      };
      const fila = (f, celdas) => filasXml.push(`<row r="${f + 1}">${celdas.join('')}</row>`);

      // titulo
      let f = 0;
      fila(f++, [`<c r="A1" s="${ESTILO.titulo}" t="inlineStr"><is><t>${x(h.titulo || nombre)}</t></is></c>`]);
      fila(f++, [`<c r="A2" s="${ESTILO.subtitulo}" t="inlineStr"><is><t>${x('Generado el ' + new Date().toLocaleString('es-MX'))}</t></is></c>`]);
      f++; // fila vacia

      // tabla principal
      const titulos = titulosUnicos(h.columnas.map(c => c.titulo));
      const filaEnc = f;
      fila(f++, titulos.map((t, c) => celda(c, filaEnc, t, ESTILO.encabezado)));
      h.filas.forEach((item, i) => {
        const ff = f++;
        fila(ff, h.columnas.map((col, c) => {
          let v = col.valor(item);
          if (col.formato && v !== '' && v !== null && !isNaN(Number(v))) v = Number(v);
          return celda(c, ff, v, estiloDe(col.formato, i));
        }));
      });
      const ultFila = f - 1;
      const ultCol = titulos.length - 1;

      const rels = [];
      const partesExtra = [];
      if (h.filas.length) {
        nTabla++;
        archivos.push([`xl/tables/table${nTabla}.xml`, tablaXml(nTabla, 'Tabla' + nTabla, 0, filaEnc, ultCol, ultFila, titulos)]);
        tipos.push(`<Override PartName="/xl/tables/table${nTabla}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>`);
        rels.push(`<Relationship Id="rIdT1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table${nTabla}.xml"/>`);
        partesExtra.push('<tableParts count="1"><tablePart r:id="rIdT1"/></tableParts>');
      }

      // grafica de barras: sus datos van en una tabla chica a la derecha
      let dibujo = '';
      const g = h.grafica;
      if (g && g.datos && g.datos.length) {
        const cg = ultCol + 2;                      // deja una columna libre
        const fg = filaEnc;
        const encG = [g.categoria || 'Concepto', g.serie || 'Valor'];
        // escribe los datos de la grafica en las mismas filas (se agregan a las filas existentes)
        const extra = {};
        extra[fg] = [celda(cg, fg, encG[0], ESTILO.encabezado), celda(cg + 1, fg, encG[1], ESTILO.encabezado)];
        g.datos.forEach(([etq, val], i) => {
          extra[fg + 1 + i] = [celda(cg, fg + 1 + i, String(etq), estiloDe('', i)), celda(cg + 1, fg + 1 + i, Number(val) || 0, estiloDe(g.formato || 'entero', i))];
        });
        // mezcla con las filas existentes
        Object.keys(extra).forEach(k => {
          const idx = filasXml.findIndex(r => r.startsWith(`<row r="${+k + 1}">`));
          if (idx >= 0) filasXml[idx] = filasXml[idx].replace('</row>', extra[k].join('') + '</row>');
          else filasXml.push(`<row r="${+k + 1}">${extra[k].join('')}</row>`);
        });
        filasXml.sort((a, b) => parseInt(a.slice(8)) - parseInt(b.slice(8)));

        nGrafica++;
        const fFinDatos = fg + g.datos.length;
        const hojaRef = nombre;
        archivos.push([`xl/charts/chart${nGrafica}.xml`, graficaXml(g.titulo || nombre, encG[1],
          abs(hojaRef, cg, fg + 1, cg, fFinDatos), abs(hojaRef, cg + 1, fg + 1, cg + 1, fFinDatos), g.datos.length, g.formato)]);
        archivos.push([`xl/drawings/drawing${nGrafica}.xml`, dibujoXml(cg + 3, fg, cg + 3 + Math.max(8, Math.min(16, g.datos.length + 4)), fg + 18)]);
        archivos.push([`xl/drawings/_rels/drawing${nGrafica}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${nGrafica}.xml"/></Relationships>`]);
        tipos.push(`<Override PartName="/xl/charts/chart${nGrafica}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`);
        tipos.push(`<Override PartName="/xl/drawings/drawing${nGrafica}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`);
        rels.push(`<Relationship Id="rIdD1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${nGrafica}.xml"/>`);
        dibujo = '<drawing r:id="rIdD1"/>';
      }

      const cols = anchos.map((w, i) => w ? `<col min="${i + 1}" max="${i + 1}" width="${w + 2}" customWidth="1"/>` : '').join('');
      const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0" showGridLines="0"${ih === 0 ? ' tabSelected="1"' : ''}><pane ySplit="${filaEnc + 1}" topLeftCell="A${filaEnc + 2}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="18" customHeight="1"/>
${cols ? `<cols>${cols}</cols>` : ''}
<sheetData>${filasXml.join('')}</sheetData>
<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
${dibujo}${partesExtra.join('')}
</worksheet>`;
      archivos.push([`xl/worksheets/sheet${n}.xml`, sheet]);
      if (rels.length) archivos.push([`xl/worksheets/_rels/sheet${n}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`]);
      tipos.push(`<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
      relsLibro.push(`<Relationship Id="rId${n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${n}.xml"/>`);
      return `<sheet name="${x(nombre)}" sheetId="${n}" r:id="rId${n}"/>`;
    });

    const nEstilos = hojas.length + 1;
    archivos.unshift(
      ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
${tipos.join('\n')}
</Types>`],
      ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`],
      ['docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>Cafetería</dc:title><dc:creator>Portal de pedidos - Cafetería</dc:creator>
<dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created>
</cp:coreProperties>`],
      ['docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Excel</Application></Properties>`],
      ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<bookViews><workbookView activeTab="0"/></bookViews>
<sheets>${hojasXml.join('')}</sheets>
</workbook>`],
      ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${relsLibro.join('\n')}
<Relationship Id="rId${nEstilos}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`],
      ['xl/styles.xml', STYLES]
    );
    return zip(archivos);
  }

  /* ---------- API publica ---------- */
  window.exportarExcel = async function (nombreArchivo, hojas) {
    if (!hojas.some(h => h.filas && h.filas.length)) { toast('No hay registros para exportar', 'error'); return; }
    const d = new Date();
    const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const blob = construirLibro(hojas);
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `${nombreArchivo}_${hoy}.xlsx` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Archivo de Excel descargado');
  };

  // Agrupa y cuenta (o suma) registros para la grafica: [['Activo', 10], ['Inactivo', 2]]
  window.agruparParaGrafica = function (filas, clave, valor = () => 1, { ordenar = true, limite = 15 } = {}) {
    const mapa = new Map();
    filas.forEach(f => { const k = String(clave(f) ?? 'Sin dato'); mapa.set(k, (mapa.get(k) || 0) + (Number(valor(f)) || 0)); });
    let datos = [...mapa.entries()];
    if (ordenar) datos.sort((a, b) => b[1] - a[1]);
    return datos.slice(0, limite);
  };
})();
