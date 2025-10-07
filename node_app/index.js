const express = require("express");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const app = express();
const PORT = 3001;

const JWT_SECRET = "asdihoashdoiashdoiq1h8h0-18h081d081h0dh18idh0has0dih0asd"; // troque por algo seguro
const API_KEY = "d190981dh0891h0dihasoidhoiwh01ihd01ihd"; // sua API key estática

app.use(express.json());

// Configuração do MySQL (igual ao docker-compose)
const dbConfig = {
  host: "mysql", // nome do serviço no docker-compose
  user: "appuser",
  password: "apppass",
  database: "appdb",
};
// Middleware para verificar JWT
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1]; // formato: "Bearer <token>"

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido ou expirado" });
    }
    req.user = user; // payload do JWT
    next();
  });
}

//Endpoint para gerar token usando API Key

app.post("/auth", (req, res) => {
  const apiKey = req.body.API_KEY;
  console.log(req.body);

  if(apiKey !== API_KEY){
    return res.status(403).json({error: "API Key Invalida"});
  }
  //Aqui voce pode incluir dados do usuario, permissoes e etc
  const payload = {role: "admin", name: "API User"};

  const token = jwt.sign(payload, JWT_SECRET, {expiresIn: "ih"});
  res.json({ token })
});
// Página inicial
app.get("/", (req, res) => {
  res.send("<h1>📖 API de Clientes com JWT + API Key</h1>");
});
//Consultar clientes por ID
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
//Consultar todos os clientes (Protegidos com JWT)
app.get("/api/v1/cliente", authenticateJWT, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM clientes");
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 🔓 Listar todos os clientes (público)
app.get("/api/v1/cliente", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM clientes");
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔒 Criar cliente (protegido com JWT)
app.post("/api/v1/cliente", authenticateJWT, async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;

    if (!nome || !email || !telefone) {
      return res.status(400).json({ error: "Campos obrigatórios: nome, email, telefone" });
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

// 🔒 Deletar cliente (protegido com JWT)
app.delete("/api/v1/cliente/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute("DELETE FROM clientes WHERE id = ?", [id]);
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    res.json({ message: "Cliente deletado com sucesso!" });
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
      message: `Cliente ${nome} criado com sucesso!`,
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
app.patch("/api/v1/cliente/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
  'UPDATE clientes SET nome = ?, email = ?, telefone = ? WHERE id = ?',
  [nome, email, telefone, id]
);
    await connection.end();
    res.send(`Cliente ${nome} atualizado com sucesso!`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 Servidor Node rodando na porta ${PORT}`);
});
