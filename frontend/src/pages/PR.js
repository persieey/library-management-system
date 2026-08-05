function PR() {
  const news = [
    { id: 1, title: "ข่าวประชาสัมพันธ์ที่ 1", content: "เนื้อหาข่าว...", published_at: "2026-08-05", author: "ผู้ดูแลระบบ" },
    { id: 2, title: "ข่าวประชาสัมพันธ์ที่ 2", content: "เนื้อหาข่าว...", published_at: "2026-08-05", author: "ผู้ดูแลระบบ" },
  ];

  return (
    <div>
      <h1>ประชาสัมพันธ์</h1>
      <table border="1">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>หัวข้อ</th>
            <th>เนื้อหา</th>
            <th>วันที่</th>
            <th>ผู้เขียน</th>
          </tr>
        </thead>
        <tbody>
          {news.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.title}</td>
              <td>{item.content}</td>
              <td>{item.published_at}</td>
              <td>{item.author}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PR;