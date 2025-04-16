from transformers import AutoTokenizer, AutoModelForCausalLM, Trainer, TrainingArguments, DataCollatorForSeq2Seq
from datasets import load_dataset

# Cargar el tokenizador y el modelo
model_name = "gpt2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# Añadir token de padding
tokenizer.pad_token = tokenizer.eos_token  # El pad_token será el mismo que el eos_token

# Cargar el dataset
dataset = load_dataset('json', data_files='questions_answers.json')

# Tokenizar los datos y agregar labels (la respuesta se utiliza como label)
def tokenize_function(examples):
    inputs = tokenizer(examples['prompt'], padding='max_length', truncation=True)
    labels = tokenizer(examples['response'], padding='max_length', truncation=True)
    inputs['labels'] = labels['input_ids']  # Añadir labels al dataset
    return inputs

# Tokenización del dataset
tokenized_datasets = dataset.map(tokenize_function, batched=True)

# Configurar el DataCollator
data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)

# Configuración de los parámetros de entrenamiento
training_args = TrainingArguments(
    output_dir="./results",  # Directorio para guardar el modelo
    num_train_epochs=1,      # Número de épocas
    per_device_train_batch_size=1,  # Tamaño del batch reducido
    save_steps=500,          # Guardar el modelo cada 500 pasos
    save_total_limit=2,      # Limitar el número de modelos guardados
    logging_dir="./logs",    # Directorio para los logs
)

# Configuración del Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets["train"],
    data_collator=data_collator,  # Usamos el DataCollator en lugar de pasar tokenizer directamente
)

# Entrenar el modelo
trainer.train()

# Guardar el modelo entrenado
model.save_pretrained("./fine_tuned_model")
tokenizer.save_pretrained("./fine_tuned_model")
