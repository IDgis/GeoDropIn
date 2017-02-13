AccountsTemplates.configure({
    forbidClientAccountCreation: true,
    overrideLoginErrors: false,
    texts: {
    	title: {
        	signIn: "Log in"
    	},
    	button: {
    		signIn: "Inloggen"
        }
	}
});

AccountsTemplates.removeField('password');
AccountsTemplates.removeField('email');
AccountsTemplates.addFields([
    {
        _id: "username",
        type: "text",
        displayName: "Gebruikersnaam",
        placeholder: "Gebruikersnaam",
        required: true,
        minLength: 5,
    },
    { 
        _id: 'password',
        type: 'password',
        required: true,
        minLength: 6,
        displayName: 'Wachtwoord',
        placeholder: 'Wachtwoord',
        validating: { curValue: false, equalsFunc: undefined, dep: { _dependentsById: {} } },
        status: { curValue: null, equalsFunc: undefined, dep: { _dependentsById: {} } }
    }
]);