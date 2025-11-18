// templates/receipt_template.js
export default function receiptTemplate(receipt, type) {
  let totalQty = receipt.items.reduce((sum, it) => sum + it.quantity, 0);
  let totalAmount = receipt.items.reduce((sum, it) => sum + (it.quantity * (it.productId.price || 0)), 0);

  return `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <title>Phiếu ${type} - ${receipt.code}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
      header { text-align: center; margin-bottom: 20px; }
      header img { max-height: 60px; }
      h1 { font-size: 24px; margin: 5px 0; }
      p { margin: 2px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #333; padding: 6px; text-align: center; font-size: 14px; }
      th { background-color: #f0f0f0; }
      tfoot td { font-weight: bold; }
      .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 14px; }
      .footer div { text-align: center; }
      @media print {
        body { margin: 0; }
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <header>
      <img src="https://via.placeholder.com/150x60?text=Logo" alt="Logo">
      <h1>PHIẾU ${type.toUpperCase()}</h1>
      <p>Mã phiếu: ${receipt.code}</p>
      <p>Ngày: ${new Date(receipt.createdAt).toLocaleDateString()}</p>
     
    </header>

    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Sản phẩm</th>
          <th>Số lượng</th>
          <th>Đơn vị</th>
          <th>Đơn giá</th>
          <th>Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${receipt.items.map((it, idx) => {
          const price = it.productId.price || 0;
          return `<tr>
            <td>${idx + 1}</td>
            <td>${it.productId.name}</td>
            <td>${it.quantity}</td>
            <td>cái</td>
            <td>${price.toLocaleString()}</td>
            <td>${(it.quantity * price).toLocaleString()}</td>
          </tr>`;
        }).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2">Tổng</td>
          <td>${totalQty}</td>
          <td></td>
          <td></td>
          <td>${totalAmount.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>

    <div class="footer">
      <div>
        Người lập<br><br>...................
      </div>
      <div>
       
      </div>
      <div>
        Người nhận<br><br>...................
      </div>
    </div>

    <script>
      window.onload = () => { window.print(); }
    </script>
  </body>
  </html>
  `;
}
