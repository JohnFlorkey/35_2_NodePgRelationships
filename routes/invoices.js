const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require("../expressError");

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`);

        return res.json({invoices: results.rows});
    } catch (e) {
        return next(e)
    }    
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query(
            `SELECT
                i.id,
                i.comp_code,
                i.amt,
                i.paid,
                i.add_date,
                i.paid_date,
                c.name,
                c.description
            FROM invoices AS i
            JOIN companies AS c ON c.code = i.comp_code
            WHERE id = $1`,
            [id]);
    
        if (results.rows.length === 0) {
            throw new ExpressError(`An invoice with id: ${id} could not be found.`, 404);
        }
        const invoice = {
            invoice: {
                id: results.rows[0].id,
                amt: results.rows[0].amt,
                paid: results.rows[0].paid,
                add_date: results.rows[0].add_date,
                paid_date: results.rows[0].paid_date,
                company: {
                    code: results.rows[0].comp_code,
                    name: results.rows[0].name,
                    description: results.rows[0].description
                }
            }
        };
        return res.json(invoice);
    } catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt) 
            VALUES ($1, $2) 
            RETURNING id, comp_code, amt, paid, add_Date, paid_date`, 
            [comp_code, amt] );

        return res.json({invoice: results.rows[0]});
    } catch(e) {
        return next(e);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt, paid } = req.body;
        const paidDate = paid ? new Date().toLocaleString() : null;

        const results = await db.query(
            `UPDATE invoices 
            SET amt = $1, paid = $2, paid_date = $3 
            WHERE id = $4 
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
            [amt, paid, paidDate, id]);

        if (results.rows.length === 0) {
            throw new ExpressError(`An invoice with id: ${id} could not be found.`, 404);
        }
        return res.json({invoice: results.rows[0]});
    } catch(e) {
        return next(e);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const invoice = await db.query(`SELECT 1 FROM invoices WHERE id = $1`, [id]);
        if (invoice.rows.length === 0) {
            throw new ExpressError(`An invoice with code: ${id} could not be found.`, 404);
        }
        await db.query(`DELETE FROM invoices WHERE id = $1`, [id]);

        return res.json({status: 'deleted'});
    } catch(e) {
        return next(e);
    }
});

module.exports = router;