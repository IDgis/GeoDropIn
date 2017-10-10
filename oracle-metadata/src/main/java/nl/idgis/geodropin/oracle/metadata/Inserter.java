package nl.idgis.geodropin.oracle.metadata;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.UUID;
import java.util.logging.Logger;
import java.util.stream.Collectors;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

public class Inserter {
	
	private static final String ITEM_TYPE = "{70737809-852C-4A03-9E22-2CECEA5B9BFA}";
	
	private final String typeStatement;
	
	private final String datasetUuid;
	private final String metadataUuid;
	private String geodropinId;
	private String title;
	private String description;
	private String datasetDate;
	private String metadataDate;
	
	public Inserter(String geodropinId, String typeStatement) {
		this.geodropinId = geodropinId;
		this.typeStatement = typeStatement;
		
		if("insert".equals(this.typeStatement)) {
			this.metadataUuid = UUID.randomUUID().toString();
			this.datasetUuid = UUID.randomUUID().toString();
		} else {
			this.metadataUuid = null;
			this.datasetUuid = null;
		}
		
	}
	
	public static void main(String[] args) throws Exception {
		String typeStatement = args[0];
		if(!"insert".equals(typeStatement) && !"update".equals(typeStatement)) {
			throw new Exception("statement must be either insert or update");
		}
		
		String client = args[1];
		String geodropinId = args[2];
		String physicalName = args[3];
		
		Inserter t = new Inserter(geodropinId, typeStatement);
		t.fetchValuesFromJson();
		
		InputStream inputStream = Inserter.class
				.getResourceAsStream("/nl/idgis/geodropin/oracle/metadata/dataset_template_" + client + ".xml");
		
		String result = null;
		
		try (BufferedReader buffer = new BufferedReader(new InputStreamReader(inputStream))) {
            String content = buffer.lines().collect(Collectors.joining("\n"));
            
            if("insert".equals(t.typeStatement)) {
            	result = content
                		.replaceAll("@metadata_uuid@", t.metadataUuid)
                		.replaceAll("@metadata_date@", t.metadataDate)
                		.replaceAll("@dataset_uuid@", t.datasetUuid)
                		.replaceAll("@title@", t.title)
                		.replaceAll("@description@", t.description)
                		.replaceAll("@dataset_date@", t.datasetDate);
            } else {
            	result = content
                		.replaceAll("@metadata_date@", t.metadataDate)
                		.replaceAll("@title@", t.title)
                		.replaceAll("@description@", t.description)
                		.replaceAll("@dataset_date@", t.datasetDate);
            }
            
        }
		
		if(result != null) {
			Class.forName("oracle.jdbc.driver.OracleDriver");
			Connection connection = DriverManager
					.getConnection("jdbc:oracle:thin:@" + 
							System.getenv("DB_IP") + ":" + 
							System.getenv("DB_PORT") + ":" + 
							System.getenv("DB_SID"), 
							System.getenv("DB_USER"), 
							System.getenv("DB_PASSWORD"));
			
			String sql;
			
			if("insert".equals(t.typeStatement)) {
				sql = "insert into GDB_ITEMS_VW values (?, ?, ?, ?, ?)";
				PreparedStatement stmt = connection.prepareStatement(sql);
				stmt.setString(1, "{" + UUID.randomUUID().toString() + "}");
				stmt.setString(2, t.geodropinId);
				stmt.setString(3, ITEM_TYPE);
				stmt.setString(4, physicalName);
				stmt.setString(5, result);
				stmt.execute();
				stmt.close();
			} else {
				sql = "update GDB_ITEMS_VW set PHYSICALNAME = ?, DOCUMENTATION = ? where GEODROPINID = ?";
				PreparedStatement stmt = connection.prepareStatement(sql);
				stmt.setString(1, physicalName);
				stmt.setString(2, result);
				stmt.setString(3, t.geodropinId);
				stmt.execute();
				stmt.close();
			}
			
			connection.close();
		}
	}
	
	public void fetchValuesFromJson() throws Exception {
		HttpURLConnection connection = (HttpURLConnection) 
				new URL(System.getenv("GEODROPIN_HOST") + "/json/" + this.geodropinId).openConnection();
		InputStream datasetInfo = connection.getInputStream();
		try (BufferedReader buffer = new BufferedReader(new InputStreamReader(datasetInfo, "UTF-8"))) {
			String json = buffer.lines().collect(Collectors.joining("\n"));
			JSONParser jsonParser = new JSONParser();
			Object resultObject = jsonParser.parse(json);
            
            if(resultObject instanceof JSONArray) {
            	// do nothing
            } else if(resultObject instanceof JSONObject) {
            	JSONObject object = (JSONObject) resultObject;
            	
            	Set<Map.Entry<String, Object>> keys = object.entrySet();
                for (Map.Entry<String, Object> entry: keys) {
                	this.setEntry(entry);
        		}
            }
		}
	}
	
	public void setEntry (Entry<String, Object> entry) {
		if("title".equals(entry.getKey())) {
    		this.title = entry.getValue().toString();
    	} else if("description".equals(entry.getKey())) {
    		this.description = entry.getValue().toString();
    	} else if("date".equals(entry.getKey())) {
    		this.datasetDate = this.getDateStringFromJson(entry.getValue());
    	} else if("lastRevisionDate".equals(entry.getKey())) {
    		this.metadataDate = this.getDateStringFromJson(entry.getValue());
    	}
	}
	
	public String getDateStringFromJson(Object value) {
		JSONObject date = (JSONObject) value;
		Set<Map.Entry<String, Long>> dateSet = date.entrySet();
		
		Iterator<Entry<String, Long>> i = dateSet.iterator();
		Entry<String, Long> e = i.next();
		
		LocalDate ld =
			    Instant.ofEpochMilli(e.getValue())
			    	.atZone(ZoneId.systemDefault())
			    	.toLocalDate();
		
		return ld.format(DateTimeFormatter.ISO_DATE);
	}
}