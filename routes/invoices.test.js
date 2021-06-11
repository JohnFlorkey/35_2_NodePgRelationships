process.env.NODE_ENV = "test";

const request = require('supertest');
const app = require('../app');
const { query } = require('../db');
const db = require('../db');
//const companies = require('./invoices');

//let testCompanies;
let testInvoices;

beforeEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);

    let companies = await db.query(
        `INSERT INTO companies (
            code, name, description
        )
        VALUES 
            ('apple', 'Apple Computer', 'Maker of OSX.'),
            ('ibm', 'IBM', 'Big blue.')
        RETURNING code, name, description`
    );

    let invoices = await db.query(
        `INSERT INTO invoices (
            comp_Code, amt, paid, paid_date
        )
        VALUES
            ('apple', 100, false, null),
            ('apple', 200, false, null),
            ('apple', 300, true, '2018-01-01'),
            ('ibm', 400, false, null)
        RETURNING id, comp_code, amt, paid, paid_date, add_date`
    );

    testCompanies = companies.rows;
    testInvoices = invoices.rows;
});

afterAll(async () => {
    await db.end();
})

describe('GET /invoices', () => {
    test('Get all invoices', async () => {
        const response = await request(app).get('/invoices');
        
        expect(response.statusCode).toBe(200);
        expect(response.body.invoices.length).toBe(4);
    });
});

describe('GET /invoices/:id', () => {
    test('Get an invoice', async () => {
        const testInvoice = testInvoices[0];
        const response = await request(app).get(`/invoices/${testInvoice.id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            invoice: {
                add_date: expect.any(String),
                amt: testInvoice.amt,
                comp_code: testInvoice.comp_code,
                id: testInvoice.id,
                paid: testInvoice.paid,
                paid_date: testInvoice.paid_date
            }
        });
    });
    test('Return 404 when company is not found', async () => {
        const maxId = await db.query(`SELECT MAX(id) FROM invoices`);
        badTestId = maxId.rows[0].max + 1;
        const response = await request(app).get(`/invoices/${badTestId}`);

        expect(response.statusCode).toBe(404);
    });
});

describe('POST /invoices', () => {
    test('Post a new invoice', async () => {
        const newInvoice = {
            comp_code: 'apple',
            amt: 550
        };
        const response = await request(app)
            .post('/invoices')
            .send(newInvoice);

        invoiceResponse = {
            invoice: {
                id: expect.any(Number),
                comp_code: newInvoice.comp_code,
                amt: newInvoice.amt,
                paid: false,
                paid_date: null,
                add_date: expect.any(String)
            }
        }

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(invoiceResponse);
    });
});

describe('PUT /invoices/:id', () => {
    test('Update an invoice', async () => {
        const id = testInvoices[0].id;
        const amt = testInvoices[0].amt + 50;
        const updatedInvoice = {
            id,
            amt
        };
        const response = await request(app)
            .put(`/invoices/${id}`)
            .send(updatedInvoice);

        const invoiceResult = {
            invoice: {
                id: testInvoices[0].id,
                comp_code: testInvoices[0].comp_code,
                amt: updatedInvoice.amt,
                paid: testInvoices[0].paid,
                paid_date: testInvoices[0].paid_date,
                add_date: expect.any(String)
            }
        };

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(invoiceResult);
    });
    test('Return 404 when company is not found', async () => {
        const maxId = await db.query(`SELECT MAX(id) FROM invoices`);
        badTestId = maxId.rows[0].max + 1;
        
        const id = badTestId;
        const amt = testInvoices[0].amt + 50;
        const updatedInvoice = {
            id,
            amt
        };
        const response = await request(app)
            .put(`/invoices/${badTestId}`)
            .send(updatedInvoice);
        
        expect(response.statusCode).toBe(404);
    });
});

describe('DELETE /invoices/:id', () => {
    test('Delete an invoice', async () => {
        const id = testInvoices[0].id;
        
        const response = await request(app).delete(`/invoices/${id}`);

        checkId = await db.query(`SELECT 1 FROM invoices WHERE id = ${id}`).data;

        expect(response.statusCode).toBe(200);
        expect(checkId).toBeUndefined();
        expect(response.body).toEqual({status: 'deleted'})
    });
    test('Return 404 when company is not found', async () => {
        const maxId = await db.query(`SELECT MAX(id) FROM invoices`);
        badTestId = maxId.rows[0].max + 1;

        const response = await request(app)
            .delete(`/invoices/${badTestId}`);
        
        expect(response.statusCode).toBe(404);
    });
});