const Excel = require('exceljs');
const path = require('path');

class ExcelService {
  async importProductsFromExcel(filePath) {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    const products = [];
    let started = false;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < 12) return;

      const rowData = row.values.filter(v => v !== undefined && v !== null);
      if (rowData.length === 0) return;

      const itemNumber = row.getCell(1).value;
      if (typeof itemNumber === 'number') {
        started = true;
        const product = {
          item: itemNumber,
          description: row.getCell(2).value || '',
          plugPrice: this.parseNumber(row.getCell(3).value),
          cablePrice: this.parseNumber(row.getCell(4).value),
          length: this.parseNumber(row.getCell(5).value),
          tailProcessing: row.getCell(6).value || '',
          cableTie: row.getCell(7).value || '',
          terminalSleeve: row.getCell(8).value || '',
          tailWire: row.getCell(9).value || '',
          processCard: row.getCell(10).value || '',
          unit: row.getCell(11).value || 'pcs',
          unitPrice: this.parseNumber(row.getCell(12).value),
          currency: row.getCell(13).value || 'RMB',
          remarks: row.getCell(14).value || '',
          wireSpec: row.getCell(25).value || '',
          wirePrice: this.parseNumber(row.getCell(26).value),
          copperPrice: this.parseNumber(row.getCell(23).value),
          materialPrice: this.parseNumber(row.getCell(24).value),
          profitMargin: this.parseNumber(row.getCell(25).value)
        };
        products.push(product);
      }
    });

    return products;
  }

  parseNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  async exportQuoteToExcel(quote, outputPath) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('报价单');

    // 设置列宽（匹配原模板32列）
    for (let i = 1; i <= 32; i++) {
      worksheet.getColumn(i).width = i === 1 ? 5 : (i >= 2 && i <= 4 ? 40 : (i >= 5 && i <= 32 ? 10 : 12));
    }

    // 行1-5: 公司信息
    worksheet.getCell('B2').value = '广 东 美 林 电 线 电 缆 有 限 公 司';
    worksheet.getCell('B3').value = 'MAINLAND ELECTRIC WIRE & CABLE CO., LTD.';
    worksheet.getCell('B4').value = '广 东 省 东 莞 市 虎 门 镇 陈 村 工 业 区';
    worksheet.getCell('B5').value = '公司电话 TEL：0769-88920080         业务邮箱 EMAIL：ywk@gdmainland.com';

    // 行6-7: 标题
    worksheet.getCell('B6').value = '报价单';
    worksheet.getCell('B7').value = 'QUOTATION';

    // 行8-10: 客户和日期
    worksheet.getCell('B8').value = quote.customerName ? `客户名称 Customer Name： ${quote.customerName}` : '客户名称 Customer Name：';
    worksheet.getCell('B9').value = quote.contactPerson ? `联系人 Customer Contact：${quote.contactPerson}` : '联系人 Customer Contact：';
    const quoteDate = quote.quoteDate || new Date().toISOString().split('T')[0];
    const year = quoteDate.split('-')[0];
    const month = quoteDate.split('-')[1];
    const day = quoteDate.split('-')[2];
    worksheet.getCell('B10').value = `报价日期 DATE：${year}年${month}月${day}日`;

    // 行11-12: 表头
    worksheet.getCell('B11').value = '项目';
    worksheet.getCell('C11').value = '名称规格';
    worksheet.getCell('D11').value = '明细';
    worksheet.getCell('L11').value = '单位';
    worksheet.getCell('M11').value = '单价';
    worksheet.getCell('N11').value = '币种';
    worksheet.getCell('O11').value = '其他';

    worksheet.getCell('B12').value = 'ITEM';
    worksheet.getCell('C12').value = 'DESCRITION&SPECIFICATION';
    worksheet.getCell('D12').value = '插头(元/个）';
    worksheet.getCell('E12').value = '线材（元/M）';
    worksheet.getCell('F12').value = '长度（M)';
    worksheet.getCell('G12').value = '尾部';
    worksheet.getCell('H12').value = '扎线';
    worksheet.getCell('I12').value = '端子护套';
    worksheet.getCell('J12').value = '尾部连接线';
    worksheet.getCell('K12').value = '料号';
    worksheet.getCell('L12').value = 'UNIT';
    worksheet.getCell('M12').value = 'UNITPRICE';
    worksheet.getCell('N12').value = 'CURRENT';
    worksheet.getCell('O12').value = 'REMARKS';
    worksheet.getCell('P12').value = '插头';
    worksheet.getCell('Q12').value = '线材';
    worksheet.getCell('R12').value = '长度';
    worksheet.getCell('S12').value = '尾部处理';
    worksheet.getCell('W12').value = '物流';
    worksheet.getCell('X12').value = '铜';
    worksheet.getCell('Y12').value = '胶料';
    worksheet.getCell('Z12').value = '铜丝价';
    worksheet.getCell('AA12').value = '胶料单价';
    worksheet.getCell('AB12').value = '毛利';
    worksheet.getCell('AC12').value = '电线规格';
    worksheet.getCell('AD12').value = '电线单价';
    worksheet.getCell('AE12').value = '日期';
    worksheet.getCell('AF12').value = ' 备注';

    // 设置表头样式
    for (let col = 1; col <= 32; col++) {
      const cell = worksheet.getCell(col, 12);
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6E6' } };
    }

    // 行13+: 产品数据
    let lastDataRow = 12;
    if (quote.items && quote.items.length > 0) {
      quote.items.forEach((item, index) => {
        const rowNum = 13 + index;
        worksheet.getCell(`B${rowNum}`).value = item.itemNumber || index + 1;
        worksheet.getCell(`C${rowNum}`).value = item.description || '';
        worksheet.getCell(`L${rowNum}`).value = item.unit || 'pcs';
        worksheet.getCell(`M${rowNum}`).value = item.unitPrice || 0;
        worksheet.getCell(`N${rowNum}`).value = item.currency || 'RMB';
        worksheet.getCell(`O${rowNum}`).value = item.processCard || item.remarks || '';
        lastDataRow = rowNum;
      });
    }

    // 条款信息（从产品数据之后开始，空一行）
    const termsRowStart = lastDataRow + 2;
    worksheet.getCell(`B${termsRowStart}`).value = `1.付款方式:   ${quote.paymentMethod || '□现金 ；þ月结  60  天（以电汇或         天的银行承兑汇票结清）；'}`;
    worksheet.getCell(`B${termsRowStart + 1}`).value = '2.交货期限：报价单双方确认后10-15工作天，以双方确认订单为准；';
    worksheet.getCell(`B${termsRowStart + 2}`).value = '3.品质材质要求：产品质量无特殊备注要求以安规为准，环保符合ROHS、REACH、PAHS标准。插头铜脚为铜合金材质，没有特定指出适用于豁免条款含铅不高于40000PPM，如有特殊环保和工艺要求（如低铅、REACH等）价格另商议；';
    worksheet.getCell(`B${termsRowStart + 3}`).value = '4.客户特殊要求：以双方签认的的样板或图纸为准，包装扎带等特殊要求备注写明；';
    worksheet.getCell(`B${termsRowStart + 4}`).value = '5.增值税：报价þ包含 □不包含13%增值税发票款；';
    worksheet.getCell(`B${termsRowStart + 5}`).value = `6.货物交付：${quote.shippingInfo || '此报价þ包含 □不包含从我司至贵司运费，货物交付至贵司地址 广东 省 中山 市；'}`;
    worksheet.getCell(`B${termsRowStart + 6}`).value = `7.报价有效期：${quote.validityTerm || '本报价依据 þ铜价  100001-102000元/吨        报出，若铜价或原材料波动剧烈且本报价单未能及时签回，报价单须重新签订；'}`;
    worksheet.getCell(`B${termsRowStart + 7}`).value = '8.本报价单作为合同的补充协议或合同本身，与合同正文具有同等的法律效力。';

    // 签名区域（从条款之后开始，空一行）
    const signRowStart = termsRowStart + 10;
    worksheet.getCell(`B${signRowStart}`).value = '     客 户 签 复∶                           ';
    worksheet.getCell(`L${signRowStart}`).value = `报 价 人∶ ${quote.salesperson || '朱建云'}                              `;
    worksheet.getCell(`B${signRowStart + 1}`).value = '   (Your Signature)                     ';
    worksheet.getCell(`L${signRowStart + 1}`).value = '(Supplier)     ';
    worksheet.getCell(`B${signRowStart + 2}`).value = '                               年       月       日';
    worksheet.getCell(`L${signRowStart + 2}`).value = '核 准：';
    worksheet.getCell(`L${signRowStart + 3}`).value = '(Approved By)     ';
    worksheet.getCell(`L${signRowStart + 5}`).value = `                 ${year} 年   ${month}月 ${day}  日     `;

    // 合并单元格
    worksheet.mergeCells('B2:AF2');
    worksheet.mergeCells('B3:AF3');
    worksheet.mergeCells('B4:AF4');
    worksheet.mergeCells('B5:AF5');
    worksheet.mergeCells('B6:AF6');
    worksheet.mergeCells('B7:AF7');
    worksheet.mergeCells('B8:AF8');
    worksheet.mergeCells('B9:AF9');
    worksheet.mergeCells('B10:AF10');

    worksheet.mergeCells(`B${termsRowStart}:AF${termsRowStart}`);
    worksheet.mergeCells(`B${termsRowStart + 1}:AF${termsRowStart + 1}`);
    worksheet.mergeCells(`B${termsRowStart + 2}:AF${termsRowStart + 2}`);
    worksheet.mergeCells(`B${termsRowStart + 3}:AF${termsRowStart + 3}`);
    worksheet.mergeCells(`B${termsRowStart + 4}:AF${termsRowStart + 4}`);
    worksheet.mergeCells(`B${termsRowStart + 5}:AF${termsRowStart + 5}`);
    worksheet.mergeCells(`B${termsRowStart + 6}:AF${termsRowStart + 6}`);
    worksheet.mergeCells(`B${termsRowStart + 7}:AF${termsRowStart + 7}`);

    worksheet.mergeCells(`B${signRowStart}:K${signRowStart}`);
    worksheet.mergeCells(`L${signRowStart}:AF${signRowStart}`);
    worksheet.mergeCells(`B${signRowStart + 1}:K${signRowStart + 1}`);
    worksheet.mergeCells(`L${signRowStart + 1}:AF${signRowStart + 1}`);
    worksheet.mergeCells(`B${signRowStart + 2}:K${signRowStart + 2}`);
    worksheet.mergeCells(`L${signRowStart + 2}:AF${signRowStart + 2}`);
    worksheet.mergeCells(`L${signRowStart + 3}:AF${signRowStart + 3}`);
    worksheet.mergeCells(`L${signRowStart + 5}:AF${signRowStart + 5}`);

    await workbook.xlsx.writeFile(outputPath);
    return outputPath;
  }

  async exportProductsToExcel(products, outputPath) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('产品列表');

    worksheet.columns = [
      { header: '项号', key: 'item', width: 8 },
      { header: '产品名称规格', key: 'description', width: 50 },
      { header: '插头(元/个)', key: 'plugPrice', width: 12 },
      { header: '线材(元/M)', key: 'cablePrice', width: 12 },
      { header: '长度(M)', key: 'length', width: 10 },
      { header: '电线规格', key: 'wireSpec', width: 15 },
      { header: '电线单价', key: 'wirePrice', width: 12 },
      { header: '单位', key: 'unit', width: 8 },
      { header: '单价', key: 'unitPrice', width: 12 },
      { header: '币种', key: 'currency', width: 8 },
      { header: '备注', key: 'remarks', width: 20 }
    ];

    products.forEach(product => {
      worksheet.addRow({
        item: product.item,
        description: product.description || '',
        plugPrice: product.plugPrice || 0,
        cablePrice: product.cablePrice || 0,
        length: product.length || 0,
        wireSpec: product.wireSpec || '',
        wirePrice: product.wirePrice || 0,
        unit: product.unit || 'pcs',
        unitPrice: product.unitPrice || 0,
        currency: product.currency || 'RMB',
        remarks: product.remarks || ''
      });
    });

    await workbook.xlsx.writeFile(outputPath);
    return outputPath;
  }
}

module.exports = new ExcelService();
