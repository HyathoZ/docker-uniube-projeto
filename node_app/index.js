const express = require("express");
const mysql = require("mysql2/promise");
const app = express();
const PORT = 3001;

app.use(express.json());

// Configuração do MySQL (igual ao docker-compose)
const dbConfig = {
  host: "mysql", // nome do serviço no docker-compose
  user: "appuser",
  password: "apppass",
  database: "appdb",
};

app.get("/", (req, res) => {
  // res.json({ message: "Node.js está rodando no Docker!" });
  res.send("Hello world!");
});

app.get("/api/v1/cliente/:id", async (req, res) => {
  try {
    const cliente = req.params.id;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM clientes WHERE id = ?",
      [cliente]
    );
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/v1/cliente", async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;
    if (!nome || !email || !telefone) {
      return res
        .status(400)
        .json({ error: "Campos obrigatórios: nome, email, telefone" });
    }
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)",
      [nome, email, telefone]
    );
    await connection.end();
    res.status(201).json({
      message: "Cliente criado com sucesso!",
      clienteId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/v1/cliente/:id", async (req, res) => {
  try {
    const cliente = req.params.id;
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute("DELETE FROM vendas WHERE cliente_id = ?", [
      cliente,
    ]);
    const [rows] = await connection.execute(
      "DELETE FROM clientes WHERE id = ?",
      [cliente]
    );
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/v1/cliente/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(`UPDATE clientes SET nome = ?, email = ?, telefone = ? WHERE id = ?`[nome, email, telefone, id]);
    res.send(`Cliente ${nome} atualizado com sucesso!`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 Servidor Node rodando na porta ${PORT}`);
});
