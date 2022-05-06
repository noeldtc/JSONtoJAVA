const fs = require('fs');
const { argv } = require('process');
if(argv[2] ==undefined) throw 'Needs a file to read.'
const path = argv[2];
console.log('Reading ' + path  )
fs.readFile(path, (err,data)=>{
    let objectClass = path.substring(2,path.lastIndexOf("."));
   createClass(data,objectName(objectClass));
})


function createClass(jsonString,objectClass){
    let json = JSON.parse(jsonString);
    let output = 'public class '+objectName(objectClass)+'{\n\n\n';
    let string_attributes= "";
    //Atributos
    Object.keys(json).forEach((key)=>{
        if(!isNaN(json[key])){
            string_attributes += "private int " + key +";\n"
        }else{
            if(key == "true" || key == "false"){
                string_attributes += "private boolean " + key +";\n"
            }else{
                try{
                    if(JSON.stringify(json[key]).charAt(0)=='{'){
                        //jsonobject
                        string_attributes += "private "+objectName(key)+ " "+key+";\n"
                        createClass(JSON.stringify(json[key]),objectName(key));

                    }else if(JSON.stringify(json[key]).charAt(0)=='['){
                        //json array
                        string_attributes += "private List<"+objectName(key)+"> " + key +"_list;\n"
                        if(json[key].length>0){
                            createClass(JSON.stringify(json[key][0]),objectName(key));
                        }
                    }else{
                        //string
                        string_attributes += "private String " + key +";\n"

                    }
                }catch(e){console.log(e);}
            }
        }
    });
    output += string_attributes ;

    //Constructor
    let args =string_attributes.replaceAll("private ","")
                .replaceAll(";\n",", ");
    args = args.substring(0,args.length-2);

    let string_constructor = "public "+objectName(objectClass)+"(" +  args + "){\n";
    Object.keys(json).forEach((key)=>{
        string_constructor+="this."+key+" = "+key + ";\n";
    });
    string_constructor+="}";

    output += "\n\n" + string_constructor + "\n\n"


    //Convert to json
    let function_head = "public JSONObject convertJSON(){\n"+
                "JSONObject res = new JSONObject();\n";

    let function_body = "";
    Object.keys(json).forEach((key)=>{
        if(!isNaN(json[key])){
            function_body += "json.put('" + key +"',this."+key+");\n"
        }else{
            if(key == "true" || key == "false"){
                function_body += "json.put('" + key +"',this."+key+");\n"
            }else{
                try{
                    if(JSON.stringify(json[key]).charAt(0)=='{'){
                        //jsonobject
                        function_body+="json.put('"+key+"',this."+key+".toJSON());\n";

                    }else if(JSON.stringify(json[key]).charAt(0)=='['){
                        //json array
                        function_body+="JSONArray " + key+"_array = new JSONArray();\n";
                        function_body+="for(int i =0; i < this."+key+".size();i++){\n";
                        function_body+= key+"_array.put(this."+key+".get(i).toJSON());\n";
                        function_body+="}\n";
                        function_body+="json.put('"+key+"',array);\n";


                    }else{
                        //string
                        function_body += "json.put('" + key +"',this."+key+");\n"
                    }
                }catch(e){console.log(e);}
            }
        }
    });

    function_body =function_head+ function_body+ "return json;\n}\n\n"
    output+= function_body;


    //Convert to object to json
    function_head = "public static "+objectName(objectClass)+" parse(JSONObject json){\n";
    function_body = "";
    Object.keys(json).forEach((key)=>{
        if(!isNaN(json[key])){
            function_body += "int "+key+" = json.getInt('" + key +"');\n"
        }else{
            if(key == "true" || key == "false"){
                function_body += "boolean "+key+" = json.getBoolean('" + key +"');\n"
            }else{
                try{
                    if(JSON.stringify(json[key]).charAt(0)=='{'){
                        //jsonobject
                        function_body+=objectName(key)+" "+key+" = "+objectName(key)+".parse(json.getJSONObject('"+key+"'));\n";
                    }else if(JSON.stringify(json[key]).charAt(0)=='['){
                        //json array
                        function_body+="JSONArray " + key+"_array = json.getJSONArray('"+key+"');\n";
                        function_body+="List<"+objectName(key)+"> "+key+"_list = new LinkedList<>();\n";
                        function_body+="for(int i =0; i < "+key+"_array.length();i++){\n";
                        function_body+= key+".add("+key+"_array.get(i););\n";
                        function_body+="}\n";

                    }else{
                        //string
                        function_body += "String "+key+" = json.getString('" + key +"');\n"
                    }
                }catch(e){console.log(e);}
            }
        }
    });
    let funct_args =string_attributes.replaceAll("private ","")
                .replaceAll("int ","").replaceAll("boolean ","")
                .replaceAll("String ","")
                .replaceAll(";\n",", ");
    Object.keys(json).forEach((key)=>{
        funct_args = funct_args.replaceAll("List<"+objectName(key)+"> ","").replaceAll(objectName(key)+" ","");
    });
    funct_args = funct_args.substring(0,args.length-2);

    function_body =function_head+ function_body+ "return new "+objectName(objectClass)+"("+ funct_args+");\n}\n\n"
    output+= function_body;


    output = output+"\n}";

    fs.writeFile(objectClass+'.java',output,(err)=>{
    })
}



function objectName(name){
    return name.toUpperCase().charAt(0) + name.substring(1,name.length);
}

