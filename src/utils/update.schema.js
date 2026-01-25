export function updateSchema(schema, data) {
    return schema.map(item => {
        if (data && data[item.type]) {
            return {
                ...item,
                ...data[item.type],
            }
        }
        return item;
    })
}