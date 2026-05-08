const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  async exportQuoteToPDF(quote, outputPath) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const stream = doc.pipe(fs.createWriteStream(outputPath));

      // 加载中文字体
      const fontPath = this.getChineseFontPath();
      if (fontPath) {
        doc.registerFont('Chinese', fontPath);
        doc.font('Chinese');
      } else {
        console.warn('未找到中文字体文件，可能导致中文显示乱码');
      }

      doc.fontSize(10);
      
      doc.text('广东美林电线电缆有限公司', { align: 'center' });
      doc.text('GUANGDONG MEILIN WIRE & CABLE CO.,LTD.', { align: 'center' });
      doc.fontSize(8);
      doc.text('地址：广东省中山市东凤镇和泰工业区', { align: 'center' });
      doc.text('电话：0760-22611688 传真：0760-22611689', { align: 'center' });
      doc.text('邮箱：sales@meilincable.com 网址：www.meilincable.com', { align: 'center' });
      doc.moveDown();

      doc.fontSize(16);
      doc.text('报 价 单', { align: 'center' });
      doc.fontSize(10);
      doc.moveDown(1);

      const infoTop = doc.y;
      doc.text(`报价单号: ${quote.quoteNumber || ''}`, 50, infoTop);
      doc.text(`报价日期: ${quote.quoteDate || new Date().toISOString().split('T')[0]}`, 200, infoTop);
      doc.text(`客户名称: ${quote.customerName || ''}`, 350, infoTop);

      const infoTop2 = infoTop + 20;
      doc.text(`报价人: ${quote.salesperson || '朱建云'}`, 50, infoTop2);
      doc.text(`状态: ${this.getStatusText(quote.status)}`, 200, infoTop2);

      doc.moveDown(2);
      doc.moveTo(50, doc.y, 550, doc.y);
      doc.moveDown(0.5);

      doc.fontSize(9);
      doc.text('ITEM', 50, doc.y);
      doc.text('产品名称规格', 90, doc.y);
      doc.text('插头(元/个)', 220, doc.y);
      doc.text('线材(元/M)', 290, doc.y);
      doc.text('长度(M)', 360, doc.y);
      doc.text('单位', 420, doc.y);
      doc.text('单价', 470, doc.y);
      doc.text('总价', 520, doc.y);

      doc.moveDown(0.3);
      doc.moveTo(50, doc.y, 550, doc.y);
      doc.moveDown(0.5);

      doc.fontSize(8);
      let y = doc.y;
      let grandTotal = 0;

      if (quote.items && quote.items.length > 0) {
        quote.items.forEach((item, index) => {
          if (y > 700) {
            doc.addPage();
            y = 40;
            
            doc.fontSize(9);
            doc.text('ITEM', 50, y);
            doc.text('产品名称规格', 90, y);
            doc.text('插头(元/个)', 220, y);
            doc.text('线材(元/M)', 290, y);
            doc.text('长度(M)', 360, y);
            doc.text('单位', 420, y);
            doc.text('单价', 470, y);
            doc.text('总价', 520, y);
            y += 20;
            doc.moveTo(50, y, 550, y);
            y += 15;
            doc.fontSize(8);
          }

          const total = item.totalPrice || (item.unitPrice * (item.quantity || 1));
          grandTotal += total;

          doc.text(String(index + 1), 50, y);
          doc.text(String(item.description || '').substring(0, 30), 90, y);
          doc.text((item.plugPrice || 0).toFixed(2), 220, y);
          doc.text((item.cablePrice || 0).toFixed(2), 290, y);
          doc.text((item.length || 0).toFixed(2), 360, y);
          doc.text(item.unit || 'pcs', 420, y);
          doc.text((item.unitPrice || 0).toFixed(4), 470, y);
          doc.text(total.toFixed(4), 520, y);

          y += 18;
        });
      }

      doc.moveDown(0.5);
      doc.moveTo(50, y, 550, y);
      doc.moveDown(0.5);

      doc.fontSize(9);
      doc.text(`合 计: ¥${grandTotal.toFixed(4)}`, 470, y);

      doc.moveDown(1);
      doc.fontSize(8);
      
      doc.text(`1.付款方式:   ${quote.paymentMethod || '□现金 ；þ月结  60  天（以电汇或         天的银行承兑汇票结清）；'}`, 50, doc.y);
      doc.moveDown(0.4);
      
      doc.text('2.交货期限：报价单双方确认后10-15工作天，以双方确认订单为准；', 50, doc.y);
      doc.moveDown(0.4);
      
      doc.text('3.品质材质要求：产品质量无特殊备注要求以安规为准，环保符合ROHS、REACH、PAHS标准。插头铜脚为铜合金材质，没有特定指出适用于豁免条款含铅不高于40000PPM，如有特殊环保和工艺要求（如低铅、REACH等）价格另商议；', 50, doc.y);
      doc.moveDown(0.4);
      
      doc.text('4.客户特殊要求：以双方签认的的样板或图纸为准，包装扎带等特殊要求备注写明；', 50, doc.y);
      doc.moveDown(0.4);
      
      doc.text('5.增值税：报价þ包含 □不包含13%增值税发票款；', 50, doc.y);
      doc.moveDown(0.4);
      
      doc.text(`6.货物交付：${quote.shippingInfo || '此报价þ包含 □不包含从我司至贵司运费，货物交付至贵司地址 广东 省 中山 市；'}`, 50, doc.y);
      doc.moveDown(0.4);
      
      doc.text(`7.报价有效期：${quote.validityTerm || '本报价依据 þ铜价  100001-102000元/吨        报出，若铜价或原材料波动剧烈且本报价单未能及时签回，报价单须重新签订；'}`, 50, doc.y);
      doc.moveDown(0.4);
      
      doc.text('8.本报价单作为合同的补充协议或合同本身，与合同正文具有同等的法律效力。', 50, doc.y);

      doc.moveDown(3);
      
      doc.fontSize(9);
      doc.text('客户签复:', 50, doc.y);
      doc.text(`报价人: ${quote.salesperson || '朱建云'}`, 350, doc.y);
      
      y = doc.y + 10;
      doc.rect(50, y, 200, 40).stroke();
      doc.rect(350, y, 150, 40).stroke();
      
      y += 50;
      doc.text('单位盖章:', 50, y);
      doc.text('核准:', 350, y);
      
      y += 10;
      doc.rect(50, y, 200, 30).stroke();
      doc.rect(350, y, 150, 30).stroke();

      y += 40;
      doc.fontSize(8);
      doc.text(`日期: ${quote.quoteDate || new Date().toISOString().split('T')[0]}`, 50, y);

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    });
  }

  getChineseFontPath() {
    // Windows系统中文字体路径
    const fontPaths = [
      'C:\\Windows\\Fonts\\simsun.ttc',      // 宋体
      'C:\\Windows\\Fonts\\simhei.ttf',      // 黑体
      'C:\\Windows\\Fonts\\msyh.ttc',        // 微软雅黑
      'C:\\Windows\\Fonts\\msyhbd.ttc',      // 微软雅黑 Bold
      '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',  // Linux 文泉驿
      '/Library/Fonts/Songti.ttc'            // macOS 宋体
    ];

    for (const fontPath of fontPaths) {
      if (fs.existsSync(fontPath)) {
        return fontPath;
      }
    }
    return null;
  }

  getStatusText(status) {
    const texts = {
      draft: '草稿',
      confirmed: '已确认',
      sent: '已发送',
      expired: '已过期'
    };
    return texts[status] || status;
  }
}

module.exports = new PDFService();
