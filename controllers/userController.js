exports.getHealth = (req, res) => {
    res.json({ 
        status: 'healthy', 
        date: new Date().toLocaleString() 
    });
};
