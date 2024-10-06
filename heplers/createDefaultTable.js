const Table = require('../models/Table');

async function createDefaultTable() {
    const defaultTable = {
        tableNumber: 0,
        seats: 0,
        status: 'available',
        location: 'Takeaway Area',
        isTakeaway: true
    };

    const existingTable = await Table.findOne({ isTakeaway: true });

    if (!existingTable) {
        await new Table(defaultTable).save();
        console.log('Default takeaway table created');
    }
}

module.exports = createDefaultTable;
