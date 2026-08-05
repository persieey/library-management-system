function Personnel() {
  const staff = [
    { id: 1, first_name: "สมชาย", last_name: "ใจดี", position: "บรรณารักษ์", email: "somchai@lib.ac.th", phone: "081-234-5678" },
    { id: 2, first_name: "สมหญิง", last_name: "รักเรียน", position: "เจ้าหน้าที่", email: "somying@lib.ac.th", phone: "082-345-6789" },
  ];

  return (
    <div>
      <h1>จัดการบุคลากร</h1>
      <table border="1">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>ชื่อ</th>
            <th>นามสกุล</th>
            <th>ตำแหน่ง</th>
            <th>อีเมล</th>
            <th>เบอร์โทร</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((person) => (
            <tr key={person.id}>
              <td>{person.id}</td>
              <td>{person.first_name}</td>
              <td>{person.last_name}</td>
              <td>{person.position}</td>
              <td>{person.email}</td>
              <td>{person.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Personnel;