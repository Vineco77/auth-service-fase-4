const { handler } = require("../src/handlers/cpfHandler")

async function testLambda() {
   const testEvent = {
    body: JSON.stringify({
        cpf: '123.456.789-09'
    })
   } 

   const result = await handler(testEvent);
   console.log('Resultado do teste: ', JSON.stringify(result, null, 2));
}

testLambda().catch(console.error)