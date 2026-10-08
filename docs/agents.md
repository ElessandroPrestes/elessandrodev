# Agentes e Responsabilidades — elessandrodev

> Definição detalhada dos papéis, responsabilidades e limites operacionais dos agentes de IA e humanos.

---

## 1. O Triângulo de Confiança SDD

No Universal SDD, humanos e agentes de IA colaboram através de limites explícitos:

```
          [Product Owner Humano]
             /              \
    (Aprova SPECs)      (Code Review)
           /                  \
          ▼                    ▼
   [Agente de IA] ──────► [Evidências de QA]
 (Implementa escopo)   (Demonstra conformidade)
```

1. **A IA não decide escopo:** Ela sugere soluções, detalha cenários técnicos e implementa código.
2. **O Humano não escreve código repetitivo:** Ele define os objetivos estratégicos, valida a experiência e audita a entrega.
3. **A Evidência é o juiz neutro:** Testes, logs de compilação e demonstrações visuais comprovam se a SPEC foi atendida.
